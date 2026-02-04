import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { config } from '../config/env';
import { ValidationError } from '../utils/errors';

export class UploadService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    // Solo inicializar si Azure está configurado
    // Si no está configurado, lanzará error cuando se intente usar
    if (config.azure.connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    } else if (config.azure.storageAccountName && config.azure.storageAccountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        config.azure.storageAccountName,
        config.azure.storageAccountKey
      );
      this.blobServiceClient = new BlobServiceClient(
        `https://${config.azure.storageAccountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    }

    this.containerName = config.azure.containerName;
  }

  private ensureInitialized(): void {
    if (!this.blobServiceClient) {
      throw new Error(
        'Azure Storage no está configurado. Configura AZURE_STORAGE_CONNECTION_STRING o AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY'
      );
    }
  }

  /**
   * Genera una URL pre-firmada (SAS token) para subir un archivo
   * @param fileName Nombre del archivo (puede incluir ruta, ej: "images/avatar.jpg")
   * @param contentType Tipo MIME del archivo (ej: "image/jpeg", "application/pdf")
   * @param expiresInMinutos Tiempo de expiración en minutos (default: 5 minutos)
   * @returns URL pre-firmada y nombre del blob
   */
  async generateUploadSAS(
    fileName: string,
    contentType: string,
    expiresInMinutos: number = 5
  ): Promise<{ uploadUrl: string; blobName: string; expiresAt: Date }> {
    this.ensureInitialized();
    
    // Validar tipo de archivo permitido
    this.validateFileType(contentType);

    // Generar nombre único para el blob (evitar colisiones)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop() || '';
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
    const blobName = `${baseName}-${timestamp}-${randomString}.${fileExtension}`;

    // Obtener contenedor
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);

    // Verificar que el contenedor existe (o crearlo si no existe)
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({
        access: 'blob', // Permite acceso público a blobs individuales
      });
    }

    // Obtener blob client
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Generar SAS token
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutos);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse('w'), // Solo escritura (write)
        startsOn: new Date(),
        expiresOn: expiresOn,
        contentType: contentType,
      },
      this.blobServiceClient.credential as StorageSharedKeyCredential
    ).toString();

    // Construir URL completa
    const uploadUrl = `${blobClient.url}?${sasToken}`;

    return {
      uploadUrl,
      blobName,
      expiresAt: expiresOn,
    };
  }

  /**
   * Genera URL pública de un blob (sin SAS, solo si el contenedor es público)
   * @param blobName Nombre del blob
   * @returns URL pública del archivo
   */
  getPublicUrl(blobName: string): string {
    this.ensureInitialized();
    
    let accountName = config.azure.storageAccountName;
    
    // Si no hay accountName, intentar extraerlo del connectionString
    if (!accountName && config.azure.connectionString) {
      const match = config.azure.connectionString.match(/AccountName=([^;]+)/);
      accountName = match?.[1] || '';
    }
    
    if (!accountName) {
      throw new Error('No se puede determinar el nombre de la cuenta de Azure Storage');
    }
    
    return `https://${accountName}.blob.core.windows.net/${this.containerName}/${blobName}`;
  }

  /**
   * Valida que el tipo de archivo esté permitido
   */
  private validateFileType(contentType: string): void {
    const allowedTypes = [
      // Imágenes
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new ValidationError(
        `Tipo de archivo no permitido: ${contentType}. Tipos permitidos: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Sube un archivo directamente a Azure Blob Storage
   * @param fileBuffer Buffer del archivo
   * @param fileName Nombre del archivo
   * @param contentType Tipo MIME del archivo
   * @param folder Carpeta donde guardar (opcional, ej: "avatars", "courses")
   * @returns URL pública del archivo subido
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder?: string
  ): Promise<{ blobName: string; publicUrl: string }> {
    this.ensureInitialized();
    
    // Validar tipo de archivo
    this.validateFileType(contentType);

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop() || '';
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
    
    // Construir blob name con folder si se proporciona
    const blobName = folder 
      ? `${folder}/${baseName}-${timestamp}-${randomString}.${fileExtension}`
      : `${baseName}-${timestamp}-${randomString}.${fileExtension}`;

    // Obtener contenedor
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    
    // Verificar que el contenedor existe
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({
        access: 'blob',
      });
    }

    // Subir archivo
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    return {
      blobName,
      publicUrl: this.getPublicUrl(blobName),
    };
  }

  /**
   * Elimina un blob del contenedor
   */
  async deleteBlob(blobName: string): Promise<void> {
    this.ensureInitialized();
    
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.deleteIfExists();
  }
}

export const uploadService = new UploadService();

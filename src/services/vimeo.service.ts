import Vimeo from '@vimeo/vimeo';
import { config } from '../config/env';
import { NotFoundError, ValidationError } from '../utils/errors';

export class VimeoService {
  private client: Vimeo.Vimeo;

  constructor() {
    if (!config.vimeo.accessToken) {
      throw new Error('VIMEO_ACCESS_TOKEN no está configurado');
    }
    this.client = new Vimeo.Vimeo('', '', config.vimeo.accessToken);
  }

  /**
   * Crea un video en Vimeo y retorna la información de upload
   * @param fileName Nombre del archivo
   * @param fileSize Tamaño del archivo en bytes
   * @returns Información del video creado y URL de upload
   */
  async createVideo(fileName: string, fileSize: number): Promise<{
    uri: string;
    upload: {
      upload_link: string;
    };
    link: string;
    id: string;
  }> {
    return new Promise((resolve, reject) => {
      this.client.request(
        {
          method: 'POST',
          path: '/me/videos',
          query: {
            upload: {
              approach: 'tus',
              size: fileSize.toString(),
            },
            name: fileName,
          },
        },
        (error, body) => {
          if (error) {
            reject(new ValidationError(`Error al crear video en Vimeo: ${error.message}`));
            return;
          }
          resolve(body as any);
        }
      );
    });
  }

  /**
   * Obtiene información de un video por su ID
   * @param videoId ID del video en Vimeo
   * @returns Información del video
   */
  async getVideo(videoId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.request(
        {
          method: 'GET',
          path: `/videos/${videoId}`,
          query: {
            fields: 'uri,name,description,duration,status,embed.html,pictures.sizes,link',
          },
        },
        (error, body) => {
          if (error) {
            if (error.statusCode === 404) {
              reject(new NotFoundError(`Video no encontrado en Vimeo: ${videoId}`));
            } else {
              reject(new ValidationError(`Error al obtener video de Vimeo: ${error.message}`));
            }
            return;
          }
          resolve(body);
        }
      );
    });
  }

  /**
   * Actualiza información de un video
   * @param videoId ID del video en Vimeo
   * @param data Datos a actualizar
   */
  async updateVideo(videoId: string, data: {
    name?: string;
    description?: string;
    privacy?: {
      view: string;
      embed: string;
    };
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.request(
        {
          method: 'PATCH',
          path: `/videos/${videoId}`,
          body: data,
        },
        (error, body) => {
          if (error) {
            if (error.statusCode === 404) {
              reject(new NotFoundError(`Video no encontrado en Vimeo: ${videoId}`));
            } else {
              reject(new ValidationError(`Error al actualizar video en Vimeo: ${error.message}`));
            }
            return;
          }
          resolve(body);
        }
      );
    });
  }

  /**
   * Elimina un video de Vimeo
   * @param videoId ID del video en Vimeo
   */
  async deleteVideo(videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.request(
        {
          method: 'DELETE',
          path: `/videos/${videoId}`,
        },
        (error) => {
          if (error) {
            if (error.statusCode === 404) {
              reject(new NotFoundError(`Video no encontrado en Vimeo: ${videoId}`));
            } else {
              reject(new ValidationError(`Error al eliminar video de Vimeo: ${error.message}`));
            }
            return;
          }
          resolve();
        }
      );
    });
  }

  /**
   * Obtiene el embed HTML de un video
   * @param videoId ID del video en Vimeo
   * @returns HTML de embed
   */
  async getEmbedHtml(videoId: string): Promise<string> {
    const video = await this.getVideo(videoId);
    return video.embed?.html || '';
  }

  /**
   * Extrae el ID del video de una URL de Vimeo
   * @param url URL del video de Vimeo
   * @returns ID del video
   */
  extractVideoIdFromUrl(url: string): string | null {
    // Formato: https://vimeo.com/123456789
    // O: https://vimeo.com/manage/videos/123456789
    // O: https://vimeo.com/123456789/...
    const match = url.match(/vimeo\.com\/.*?(\d+)/);
    return match ? match[1] : null;
  }
}

// Solo crear instancia si el token está configurado
let vimeoServiceInstance: VimeoService | null = null;

export const vimeoService = (() => {
  if (!vimeoServiceInstance) {
    try {
      vimeoServiceInstance = new VimeoService();
    } catch (error) {
      console.warn('VimeoService no inicializado:', (error as Error).message);
    }
  }
  return vimeoServiceInstance;
})();

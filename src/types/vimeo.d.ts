declare module '@vimeo/vimeo' {
  namespace Vimeo {
    interface RequestOptions {
      method?: string;
      path?: string;
      query?: any;
      body?: any;
    }

    class Vimeo {
      constructor(clientId: string, clientSecret: string, accessToken: string);
      request(
        options: RequestOptions,
        callback: (error: any, body: any, statusCode?: number) => void
      ): void;
    }
  }

  export = Vimeo;
}

export function handleApiError(error: { response: { data: { error: { message: any; }; }; }; error: { message: any; }; message: any; }, defaultMessage = "An unexpected error occurred.") {
   if (!error) return defaultMessage;

   // Strapi formatted error
   if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
   }

   //Strapi new error format
   if (error?.error?.message) {
      return error.error.message;
   }

   // Axios network error
   if (error?.message) {
      return error.message;
   }

   return defaultMessage;

}

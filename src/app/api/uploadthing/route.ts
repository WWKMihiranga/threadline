import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "./core";

// Reads UPLOADTHING_TOKEN from the environment.
export const { GET, POST } = createRouteHandler({ router: uploadRouter });

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getAdmin } from "@/lib/auth/session";

const f = createUploadthing();

export const uploadRouter = {
  // Product photos: images only, 4MB max each. Uploads are only accepted from a
  // signed-in admin; the check runs on the server before Uploadthing issues an upload URL.
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
    .middleware(async () => {
      const admin = await getAdmin();
      if (!admin) throw new UploadThingError("Unauthorized");
      return { adminId: admin.id };
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

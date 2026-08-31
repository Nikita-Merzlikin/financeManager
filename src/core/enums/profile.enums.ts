export enum AvatarMimeTypeEnum {
  JPEG = "image/jpeg",
  JPG = "image/jpg",
  PNG = "image/png",
  WEBP = "image/webp",
}
export { AvatarMimeTypeEnum as AvatarMimeType };

export const ALLOWED_AVATAR_MIME_TYPES = new Set<string>(
  Object.values(AvatarMimeTypeEnum),
);

export const AVATAR_MIME_TO_EXT: Record<AvatarMimeTypeEnum, string> = {
  [AvatarMimeTypeEnum.JPEG]: "jpg",
  [AvatarMimeTypeEnum.JPG]: "jpg",
  [AvatarMimeTypeEnum.PNG]: "png",
  [AvatarMimeTypeEnum.WEBP]: "webp",
};

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

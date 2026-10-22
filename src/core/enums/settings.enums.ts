export enum ProfileVisibilityEnum {
  PUBLIC = "public",
  PRIVATE = "private",
}
export { ProfileVisibilityEnum as ProfileVisibility };

export const DEFAULT_PROFILE_VISIBILITY = ProfileVisibilityEnum.PRIVATE;
export const DEFAULT_SHOW_EMAIL = false;
export const DEFAULT_SHOW_DATE_OF_BIRTH = false;
export const DEFAULT_SHOW_AVATAR = true;
export const DEFAULT_ALLOW_ANALYTICS = false;

/**
 * 유저의 표시 이름을 반환합니다.
 * displayName이 비어 있으면 username을 대신 사용합니다.
 */
export function getUserDisplayName(
  displayName: string | null | undefined,
  username: string
): string {
  return displayName || username;
}
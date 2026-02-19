const ROUTE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ROUTE_ID_LENGTH = 100;

export function isValidRouteId(id: string): boolean {
  return id.length > 0 && id.length <= MAX_ROUTE_ID_LENGTH && ROUTE_ID_PATTERN.test(id);
}

export type SelectionInfo = {
  /** Opaque, base64-encoded FamilyActivitySelection token from the picker. */
  familyActivitySelection: string | null;
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};

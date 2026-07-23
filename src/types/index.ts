export interface Device {
  id: string;
  activationCode: string;
  isActive: boolean;
  assignedServerUrl: string;
  groupId?: string;
  groupIds?: string[];
  name?: string;
  createdAt: Date;
  activatedAt?: Date;
  lastSeenAt?: Date;
  isOnline?: boolean;
}

export interface Device {
  id: string;
  activationCode: string;
  isActive: boolean;
  assignedServerUrl: string;
  groupId?: string;
  createdAt: Date;
  activatedAt?: Date;
}

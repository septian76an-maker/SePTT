export interface Device {
  id: string;
  activationCode: string;
  isActive: boolean;
  assignedServerUrl: string;
  groupId?: string;
  name?: string;
  createdAt: Date;
  activatedAt?: Date;
}

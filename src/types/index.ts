export interface Device {
  id: string;
  activationCode: string;
  isActive: boolean;
  assignedServerUrl: string;
  createdAt: Date;
  activatedAt?: Date;
}

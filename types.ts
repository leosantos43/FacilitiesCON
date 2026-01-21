
export enum UserRole {
  ADMIN = 'admin',
  SYNDIC = 'syndic',
  PROFESSIONAL = 'professional',
  RESIDENT = 'resident'
}

export enum RequestStatus {
  OPEN = 'Aberto',
  PENDING_APPROVAL = 'Aguardando Aprovação', 
  WAITING_BUDGET_APPROVAL = 'Aguardando Orçamento',
  BUDGET_APPROVED = 'Orçamento Aprovado',
  IN_PROGRESS = 'Em Execução',
  COMPLETED = 'Concluído',
  CANCELED = 'Cancelado'
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp: string;
  role: UserRole;
  condo_name?: string; 
  block?: string; 
  apartment?: string; 
  is_validated?: boolean;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export interface ServiceRequest {
  id: string;
  protocol: string;
  type: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  syndic_id: string; 
  syndic_name: string;
  requester_id?: string; 
  requester_name?: string; 
  requester_whatsapp?: string;
  is_private: boolean; 
  unit_info?: string; 
  condo_name: string;
  condo_address?: string;
  professional_id?: string;
  professional_name?: string;
  professional_cpf?: string;
  professional_photo?: string;
  created_at: string;
  updated_at: string;
  timeline: TimelineEvent[];
  photos?: string[];
  photos_before?: string[];
  photos_after?: string[];
  budget_value?: number;
  budget_status?: 'pending' | 'approved' | 'rejected' | 'negotiating';
  technical_report?: string;
  budget_description?: string;
  is_hourly?: boolean;
  estimated_hours?: number;
}

export interface TimelineEvent {
  id: string;
  request_id: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  request_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
  role: UserRole;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface Professional {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  specialty: string;
  active: boolean;
  photo?: string;
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  syndic_id?: string;
  syndic_name?: string;
  towers: number;
  residents_count: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  created_at?: string;
}

export enum TestimonialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Testimonial {
  id: string;
  author_name: string;
  condo_name: string;
  rating: number;
  message: string;
  status: TestimonialStatus;
  created_at: string;
}

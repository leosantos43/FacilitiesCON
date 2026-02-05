
import { createClient } from '@supabase/supabase-js';
import { 
  User, 
  UserRole, 
  ServiceRequest, 
  RequestStatus, 
  Priority, 
  Professional, 
  Notification, 
  ChatMessage, 
  Condominium,
  Testimonial,
  TestimonialStatus,
  Service,
  CompanySettings
} from '../types';

const SUPABASE_URL = 'https://icfcyoguwnkkinoyucdt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZmN5b2d1d25ra2lub3l1Y2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mjk5NzYsImV4cCI6MjA4NDAwNTk3Nn0.y_Jxr8Btkr8HTIXdkiIQQBSZgOw_4v1h3p2Iv_dZrvs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DatabaseAuthService {
  
  async login(email: string, password?: string): Promise<{ user: User | null, error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password || '',
      });

      if (authError) return { user: null, error: authError.message };
      if (!authData.user) return { user: null, error: 'Usuário não encontrado.' };

      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profError) return { user: null, error: 'Erro ao carregar dados do perfil.' };
      
      return { user: profile as User, error: null };
    } catch (err) {
      return { user: null, error: 'Falha técnica na conexão.' };
    }
  }

  async logout() {
    await supabase.auth.signOut();
  }

  async register(userData: any): Promise<{ success: boolean; error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          whatsapp: userData.whatsapp,
          role: userData.role || UserRole.RESIDENT,
          condo_name: userData.condo_name,
          block: userData.block,
          apartment: userData.apartment
        }
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
      
    return profile as User;
  }

  async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('profiles').select('*').order('name');
    return (data || []) as User[];
  }

  async createUser(userData: any): Promise<void> {
    const { error } = await this.register(userData);
    if (error) throw new Error(error);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async validateUser(userId: string): Promise<void> {
    await this.updateUser(userId, { is_validated: true });
    await this.createNotification(userId, 'Cadastro Aprovado!', 'Seu acesso foi liberado. Faça login para abrir chamados.', '/login');
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw new Error(error.message);
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  }

  async getServiceRequests(userId?: string, role?: UserRole, condoName?: string): Promise<ServiceRequest[]> {
    let query = supabase.from('service_requests').select(`*, timeline:request_timeline(*)`).order('created_at', { ascending: false });
    
    if (role === UserRole.SYNDIC && condoName) {
      query = query.eq('condo_name', condoName);
    } else if (role === UserRole.RESIDENT && userId && condoName) {
      query = query.or(`requester_id.eq.${userId},and(condo_name.eq.${condoName},is_private.eq.false)`);
    }
    
    const { data } = await query;
    return (data || []) as ServiceRequest[];
  }

  async createServiceRequest(requestData: any, user: User): Promise<void> {
    const protocol = `FCON-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase.from('service_requests').insert([{
      ...requestData,
      protocol,
      status: RequestStatus.PENDING_APPROVAL,
      requester_id: user.id,
      requester_name: user.name,
      requester_whatsapp: user.whatsapp,
      syndic_id: user.role === UserRole.SYNDIC ? user.id : null,
      condo_name: user.condo_name || 'Geral',
      unit_info: user.apartment ? `${user.block}-${user.apartment}` : undefined,
    }]).select().single();

    if (error) throw new Error(error.message);
    
    const admins = await this.getUsers().then(u => u.filter(user => user.role === UserRole.ADMIN));
    for (const admin of admins) {
      await this.createNotification(admin.id, 'Novo Chamado', `${user.name} abriu um chamado em ${user.condo_name}`, `/admin/request/${data.id}`);
    }
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<void> {
    const { error } = await supabase.from('service_requests').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async addTimelineEvent(requestId: string, title: string, description: string): Promise<void> {
    await supabase.from('request_timeline').insert([{
      request_id: requestId, title, description, timestamp: new Date().toISOString()
    }]);
  }

  async getRequestMessages(requestId: string): Promise<ChatMessage[]> {
    const { data } = await supabase.from('chat_messages').select('*').eq('request_id', requestId).order('created_at', { ascending: true });
    return (data || []) as ChatMessage[];
  }

  async sendRequestMessage(requestId: string, user: User, message: string): Promise<ChatMessage> {
    const { data, error } = await supabase.from('chat_messages').insert([{
      request_id: requestId,
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      message: message.trim()
    }]).select().single();
    if(error) throw new Error(error.message);
    return data as ChatMessage;
  }

  async getCondominiums(): Promise<Condominium[]> {
    const { data } = await supabase.from('condominiums').select('*').order('name');
    return (data || []) as Condominium[];
  }

  async createCondominium(condo: Partial<Condominium>): Promise<void> {
    await supabase.from('condominiums').upsert(condo);
  }

  async deleteCondominium(id: string): Promise<void> {
    await supabase.from('condominiums').delete().eq('id', id);
  }

  async getProfessionals(): Promise<Professional[]> {
    const { data } = await supabase.from('professionals').select('*').order('name');
    return (data || []) as Professional[];
  }

  async saveProfessional(professional: Partial<Professional>): Promise<void> {
    await supabase.from('professionals').upsert(professional);
  }

  async getServices(): Promise<Service[]> {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    return (data || []) as Service[];
  }

  async saveService(service: Partial<Service>): Promise<void> {
    await supabase.from('services').upsert(service);
  }

  async deleteService(id: string): Promise<void> {
    await supabase.from('services').delete().eq('id', id);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as Notification[];
  }

  async createNotification(userId: string, title: string, message: string, link?: string): Promise<void> {
    await supabase.from('notifications').insert([{
      user_id: userId, title, message, link, read: false
    }]);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  }

  async getTestimonials(onlyApproved: boolean = false): Promise<Testimonial[]> {
    let query = supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (onlyApproved) query = query.eq('status', TestimonialStatus.APPROVED);
    const { data } = await query;
    return (data || []) as Testimonial[];
  }

  async updateTestimonialStatus(id: string, status: TestimonialStatus): Promise<void> {
    await supabase.from('testimonials').update({ status }).eq('id', id);
  }

  async getCompanySettings(): Promise<CompanySettings> {
    const { data } = await supabase.from('company_settings').select('*').maybeSingle();
    if (data) return data as CompanySettings;
    return {
      id: 'default',
      company_name: 'FacilitiesCON Engenharia Ltda',
      cnpj: '00.000.000/0001-00',
      address: 'São Paulo, SP',
      phone: '(11) 98888-7777',
      email: 'operacional@facilitiescon.com.br'
    };
  }

  async saveCompanySettings(settings: Partial<CompanySettings>): Promise<void> {
    await supabase.from('company_settings').upsert({ ...settings, id: 'default' });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Senha redefinida com sucesso!' };
  }
}

export const db = new DatabaseAuthService();

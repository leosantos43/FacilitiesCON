
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

const SESSION_KEY = 'fcon_user_session';

class ManualDatabaseAuthService {
  
  async login(email: string, password?: string): Promise<{ user: User | null, error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password || '')
        .maybeSingle();

      if (error) return { user: null, error: 'Erro ao conectar ao banco de dados.' };
      if (!data) return { user: null, error: 'E-mail ou senha incorretos.' };

      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      return { user: data as User, error: null };
    } catch (err) {
      return { user: null, error: 'Falha técnica no login.' };
    }
  }

  async getResidentByEmail(email: string): Promise<{ user: User | null, error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('role', UserRole.RESIDENT)
        .maybeSingle();
      
      if (error) return { user: null, error: 'Erro de conexão.' };
      if (!data) return { user: null, error: 'Morador não localizado.' };
      if (!data.is_validated) return { user: null, error: 'Cadastro pendente de aprovação.' };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      return { user: data as User, error: null };
    } catch (e) {
      return { user: null, error: 'Falha ao processar login de morador.' };
    }
  }

  async logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  async register(userData: any): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('profiles').insert([{
      ...userData,
      is_validated: false,
      role: UserRole.RESIDENT
    }]);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  async getCurrentUser(): Promise<User | null> {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      const { data } = await supabase.from('profiles').select('*').eq('id', parsed.id).maybeSingle();
      if (!data) {
        this.logout();
        return null;
      }
      return data as User;
    } catch {
      return null;
    }
  }

  async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('profiles').select('*').order('name');
    return (data || []) as User[];
  }

  async createUser(userData: any): Promise<void> {
    const { error } = await supabase.from('profiles').insert([userData]);
    if (error) throw new Error(error.message);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async validateUser(userId: string): Promise<void> {
    await this.updateUser(userId, { is_validated: true });
    await this.createNotification(userId, 'Cadastro Validado!', 'Seu acesso ao Portal FacilitiesCON foi liberado. Seja bem-vindo!', '/');
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw new Error(error.message);
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const { error } = await supabase.from('profiles').update({ password: newPassword }).eq('id', userId);
    return !error;
  }

  async getServiceRequests(userId?: string, role?: UserRole, condoName?: string): Promise<ServiceRequest[]> {
    let query = supabase.from('service_requests').select(`*, timeline:request_timeline(*)`).order('created_at', { ascending: false });
    
    if (role === UserRole.SYNDIC && condoName) {
      query = query.eq('condo_name', condoName);
    } 
    else if (role === UserRole.RESIDENT && userId) {
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
      syndic_id: user.role === UserRole.SYNDIC ? user.id : null,
      syndic_name: user.role === UserRole.SYNDIC ? user.name : 'Administração Central',
      requester_id: user.id,
      requester_name: user.name,
      requester_whatsapp: user.whatsapp,
      condo_name: user.condo_name || 'Unidade Autônoma',
      unit_info: user.apartment ? `${user.block}-${user.apartment}` : undefined,
    }]).select().single();
    
    if (error) throw new Error(error.message);

    // Notificar todos os admins sobre novo chamado
    const usersList = await this.getUsers();
    const admins = usersList.filter(u => u.role === UserRole.ADMIN);
    for (const admin of admins) {
      await this.createNotification(
        admin.id, 
        'Novo Chamado Aberto', 
        `${user.name} abriu um chamado para ${requestData.type} no condomínio ${user.condo_name}.`,
        `/admin/request/${data.id}`
      );
    }
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<void> {
    const { error } = await supabase.from('service_requests').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async addTimelineEvent(requestId: string, title: string, description: string): Promise<void> {
    const { error } = await supabase.from('request_timeline').insert([{
      request_id: requestId,
      title,
      description,
      timestamp: new Date().toISOString()
    }]);
    if (error) throw new Error(error.message);
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

    // Notificar destinatário
    const { data: request } = await supabase.from('service_requests').select('*').eq('id', requestId).single();
    if (request) {
      // Se quem mandou foi morador/síndico, avisa admins
      if (user.role !== UserRole.ADMIN) {
        const usersList = await this.getUsers();
        const admins = usersList.filter(u => u.role === UserRole.ADMIN);
        for (const admin of admins) {
          if (admin.id !== user.id) {
            await this.createNotification(admin.id, 'Nova Mensagem', `${user.name} enviou uma mensagem no chamado #${request.protocol}.`, `/admin/request/${requestId}`);
          }
        }
      } else {
        // Se quem mandou foi admin, avisa o solicitante
        if (request.requester_id && request.requester_id !== user.id) {
           await this.createNotification(request.requester_id, 'Mensagem da Gestão', `A FacilitiesCON enviou uma mensagem sobre o seu chamado #${request.protocol}.`, `/app/request/${requestId}`);
        }
      }
    }

    return data as ChatMessage;
  }

  async getCondominiums(): Promise<Condominium[]> {
    const { data } = await supabase.from('condominiums').select('*').order('name');
    return (data || []) as Condominium[];
  }

  async createCondominium(condo: Partial<Condominium>): Promise<void> {
    const { error } = await supabase.from('condominiums').upsert(condo);
    if (error) throw new Error(error.message);
  }

  async deleteCondominium(id: string): Promise<void> {
    const { error } = await supabase.from('condominiums').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getProfessionals(): Promise<Professional[]> {
    const { data } = await supabase.from('professionals').select('*').order('name');
    return (data || []) as Professional[];
  }

  async saveProfessional(professional: Partial<Professional>): Promise<void> {
    const { error } = await supabase.from('professionals').upsert(professional);
    if (error) throw new Error(error.message);
  }

  async getServices(): Promise<Service[]> {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    return (data || []) as Service[];
  }

  async saveService(service: Partial<Service>): Promise<void> {
    const { error } = await supabase.from('services').upsert(service);
    if (error) throw new Error(error.message);
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
    const { error } = await supabase.from('testimonials').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getCompanySettings(): Promise<CompanySettings> {
    const { data, error } = await supabase.from('company_settings').select('*').maybeSingle();
    if (data) return data as CompanySettings;
    
    const defaultSettings: CompanySettings = {
      id: 'default',
      company_name: 'FacilitiesCON Engenharia Ltda',
      cnpj: '00.000.000/0001-00',
      address: 'São Paulo, SP',
      phone: '(11) 98888-7777',
      email: 'operacional@facilitiescon.com.br'
    };
    return defaultSettings;
  }

  async saveCompanySettings(settings: Partial<CompanySettings>): Promise<void> {
    const { error } = await supabase.from('company_settings').upsert({
      ...settings,
      id: 'default'
    });
    if (error) throw new Error(error.message);
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!token) return { success: false, message: 'Token inválido ou expirado.' };
    return { success: true, message: 'Senha redefinida com sucesso!' };
  }
}

export const db = new ManualDatabaseAuthService();

interface PlanInfo {
  id: number;
  name: string;
  price: number;
  automation_email: boolean;
  automation_email_limits: number;
  automation_email_with_tags: boolean;
  custom_invoice_number: boolean;
  more_paper_size: boolean;
  live_support: boolean;
  charge_id?: boolean;
}

export interface ConfigData {
  page: string;
  mode: string;
  template_info: Record<string, any>;
  all_templates: any[];
  info: {
    address: string;
    state: string;
    city: string;
    postcode: string;
    name: string;
    vat: string;
    phone: string;
    zip: string;
    qrcode: string;
    email: string;
    allow_backend: boolean;
    allow_frontend: boolean;
    setup_status: {
      is_open_setup_info: boolean;
      is_allow_frontend: boolean;
      is_open_template_setting: boolean;
    };
    default_template: string;
    shop: string;
    shop_name: string;
    shop_owner: string;
    email_notify_template: string;
    download_link_text: string;
    invoice_start_number: string;
    rate: number;
    front_button_label: string;
    close_congratulation: boolean;
  };
  templates: any[];
  preview: Record<string, any>;
  live_support: boolean;
  custom_fonts: any[];
  current_plan: PlanInfo;
  all_plans: PlanInfo[];
  shop_url: string;
  list_apps: any[];
  shop: string;
  api_key: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  isActive?: boolean;
  hasSettings?: boolean;
  expanded?: boolean;
  statusKey?: keyof ConfigData['info']['setup_status'];
}

// Declare the window object with our config
declare global {
  interface Window {
    config?: ConfigData;
  }
}
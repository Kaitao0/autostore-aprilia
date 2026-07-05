/**
 * Hand-written database types aligned with supabase/migrations.
 * When the Supabase project is connected, these can be regenerated with
 * `supabase gen types typescript` and diffed against this file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "super_admin" | "editor" | "viewer";

export type VehicleCondition = "nuovo" | "usato" | "km0" | "aziendale" | "demo";

export type AvailabilityStatus =
  | "disponibile"
  | "riservato"
  | "venduto"
  | "in_arrivo"
  | "non_disponibile";

export type FuelType =
  | "benzina"
  | "diesel"
  | "gpl"
  | "metano"
  | "hybrid"
  | "hybrid_plugin"
  | "mild_hybrid"
  | "elettrico"
  | "altro";

export type Transmission = "manuale" | "automatico" | "semiautomatico";

export type BodyType =
  | "berlina"
  | "station_wagon"
  | "suv"
  | "crossover"
  | "citycar"
  | "utilitaria"
  | "monovolume"
  | "coupe"
  | "cabrio"
  | "pickup"
  | "furgone"
  | "altro";

export type Drivetrain = "anteriore" | "posteriore" | "integrale";

export type LeadType =
  | "info_veicolo"
  | "test_drive"
  | "visita"
  | "permuta"
  | "valutazione_usato"
  | "contatto_generico"
  | "finanziamento";

export type LeadStatus =
  | "nuovo"
  | "da_contattare"
  | "contattato"
  | "appuntamento"
  | "chiuso"
  | "non_interessato"
  | "spam";

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface VehicleRow {
  id: string;
  slug: string;
  internal_code: string | null;
  external_id: string | null;
  autoscout_url: string | null;
  make: string;
  model: string;
  version: string | null;
  display_title: string | null;
  condition: VehicleCondition;
  body_type: BodyType | null;
  availability: AvailabilityStatus;
  price: number | null;
  previous_price: number | null;
  currency: string;
  price_on_request: boolean;
  vat_deductible: boolean | null;
  year: number | null;
  registration_month: number | null;
  mileage: number | null;
  fuel_type: FuelType | null;
  transmission: Transmission | null;
  power_hp: number | null;
  power_kw: number | null;
  engine_displacement: number | null;
  exterior_color: string | null;
  interior_color: string | null;
  doors: number | null;
  seats: number | null;
  emission_class: string | null;
  drivetrain: Drivetrain | null;
  previous_owners: number | null;
  plate: string | null;
  vin: string | null;
  description: string | null;
  warranty: string | null;
  internal_notes: string | null;
  location: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  equipment: string[];
  featured: boolean;
  published: boolean;
  showroom_enabled: boolean;
  source: string;
  is_demo: boolean;
  sort_order: number;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Public projection — plate, vin and internal_notes are excluded by the view. */
export type PublicVehicleRow = Omit<
  VehicleRow,
  "plate" | "vin" | "internal_notes" | "internal_code" | "external_id" | "source" | "published"
>;

export interface VehicleImageRow {
  id: string;
  vehicle_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleFeatureRow {
  id: string;
  name: string;
  category: string | null;
  slug: string;
  created_at: string;
}

export interface VehicleFeatureAssignmentRow {
  vehicle_id: string;
  feature_id: string;
}

export interface VehicleStatusHistoryRow {
  id: string;
  vehicle_id: string;
  from_status: AvailabilityStatus | null;
  to_status: AvailabilityStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface LeadRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  lead_type: LeadType;
  vehicle_id: string | null;
  source_page: string | null;
  source: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  preferred_channel: string | null;
  privacy_consent: boolean;
  trade_in_info: Json | null;
  created_at: string;
  updated_at: string;
}

export interface TradeInRequestRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  car_make: string;
  car_model: string;
  car_version: string | null;
  car_year: number | null;
  car_mileage: number | null;
  car_fuel_type: FuelType | null;
  car_transmission: Transmission | null;
  plate: string | null;
  existing_finance: boolean;
  message: string | null;
  status: LeadStatus;
  privacy_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradeInImageRow {
  id: string;
  trade_in_id: string;
  storage_path: string;
  created_at: string;
}

export interface BusinessHoursEntry {
  days: string;
  hours: string;
}

export interface SocialProfileEntry {
  platform: string;
  url: string;
  enabled: boolean;
}

export interface BusinessInformationRow {
  id: number;
  name: string;
  legal_name: string;
  vat_number: string;
  tax_code: string;
  rea: string | null;
  sdi: string | null;
  pec: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  province: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: Json;
  social: Json;
  map_lat: number | null;
  map_lng: number | null;
  logo_url: string | null;
  autoscout_dealer_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingRow {
  key: string;
  value: Json;
  updated_at: string;
}

export interface ContentSectionRow {
  key: string;
  locale: string;
  value: Json;
  updated_at: string;
}

export interface AutoscoutSettingsRow {
  id: number;
  embed_snippet: string | null;
  dealer_url: string | null;
  feed_url: string | null;
  last_import_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmailNotificationRow {
  id: string;
  to_email: string;
  subject: string;
  type: string;
  related_lead_id: string | null;
  status: string;
  provider_id: string | null;
  error: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Json | null;
  created_at: string;
}

export interface SlugRedirectRow {
  old_slug: string;
  vehicle_id: string;
  created_at: string;
}

/** Insert helper: everything optional except the truly required columns. */
type InsertOf<Row, Required extends keyof Row> = Partial<Row> &
  Pick<Row, Required>;

interface TableDef<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, InsertOf<ProfileRow, "id" | "email">, Partial<ProfileRow>>;
      user_roles: TableDef<UserRoleRow, InsertOf<UserRoleRow, "user_id" | "role">, Partial<UserRoleRow>>;
      vehicles: TableDef<VehicleRow, InsertOf<VehicleRow, "slug" | "make" | "model">, Partial<VehicleRow>>;
      vehicle_images: TableDef<VehicleImageRow, InsertOf<VehicleImageRow, "vehicle_id" | "storage_path" | "public_url">, Partial<VehicleImageRow>>;
      vehicle_features: TableDef<VehicleFeatureRow, InsertOf<VehicleFeatureRow, "name" | "slug">, Partial<VehicleFeatureRow>>;
      vehicle_feature_assignments: TableDef<VehicleFeatureAssignmentRow, VehicleFeatureAssignmentRow, Partial<VehicleFeatureAssignmentRow>>;
      vehicle_status_history: TableDef<VehicleStatusHistoryRow, InsertOf<VehicleStatusHistoryRow, "vehicle_id" | "to_status">, Partial<VehicleStatusHistoryRow>>;
      leads: TableDef<LeadRow, InsertOf<LeadRow, "first_name" | "email" | "privacy_consent">, Partial<LeadRow>>;
      trade_in_requests: TableDef<TradeInRequestRow, InsertOf<TradeInRequestRow, "first_name" | "email" | "car_make" | "car_model" | "privacy_consent">, Partial<TradeInRequestRow>>;
      trade_in_images: TableDef<TradeInImageRow, InsertOf<TradeInImageRow, "trade_in_id" | "storage_path">, Partial<TradeInImageRow>>;
      business_information: TableDef<BusinessInformationRow, InsertOf<BusinessInformationRow, "name" | "legal_name" | "vat_number" | "tax_code">, Partial<BusinessInformationRow>>;
      site_settings: TableDef<SiteSettingRow, InsertOf<SiteSettingRow, "key">, Partial<SiteSettingRow>>;
      content_sections: TableDef<ContentSectionRow, InsertOf<ContentSectionRow, "key">, Partial<ContentSectionRow>>;
      autoscout_settings: TableDef<AutoscoutSettingsRow, Partial<AutoscoutSettingsRow>, Partial<AutoscoutSettingsRow>>;
      email_notifications: TableDef<EmailNotificationRow, InsertOf<EmailNotificationRow, "to_email" | "subject" | "type">, Partial<EmailNotificationRow>>;
      audit_logs: TableDef<AuditLogRow, InsertOf<AuditLogRow, "action" | "entity_type">, Partial<AuditLogRow>>;
      slug_redirects: TableDef<SlugRedirectRow, InsertOf<SlugRedirectRow, "old_slug" | "vehicle_id">, Partial<SlugRedirectRow>>;
    };
    Views: {
      public_vehicles: {
        Row: PublicVehicleRow;
        Relationships: [];
      };
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
      is_staff: {
        Args: { _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      vehicle_condition: VehicleCondition;
      availability_status: AvailabilityStatus;
      fuel_type: FuelType;
      transmission: Transmission;
      body_type: BodyType;
      drivetrain: Drivetrain;
      lead_type: LeadType;
      lead_status: LeadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

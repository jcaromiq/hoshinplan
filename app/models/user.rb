class User < ActiveRecord::Base

  include ModelBase
  include ColorHelper
  
  hobo_user_model # Don't put anything above this
  
  NEXT_FRIDAY = DateTime.now.next_week.next_day(4)
  
  include HoboOmniauth::MultiAuth
  
  fields do
    name            :string
    firstName       :string
    lastName        :string
    color           Color
    email_address   :email_address, :login => true, :index => true, :unique => true
    administrator   :boolean, :default => false
    tutorial_step   :integer
    timezone        HoboFields::Types::Timezone
    timestamps
    language        EnumLanguage
    last_seen_at    :date
    last_login_at   :datetime
    login_count     :integer
    payments_count  :integer, :default => 0, :null => false
    preferred_view  EnumView, :required, :default=> :expanded
    beta_access     :boolean
    news            :boolean, default: true
  end
  bitmask :tutorial_step, :as => [:company, :hoshin, :goal, :area, :objective, :indicator, :task, :followup]

  has_attached_file :image, {
    :styles => {
      :blur => "104x104#",
      :thumb2x => "208x208#",
      :thumb => "104x104#",
      :mini2x => "58x58#",
      :mini => "29x29#"
    },
    :convert_options => {
      :blur => "-blur 0x12 -fill black -colorize 20% -quality 80 -interlace Plane",
      :mini => "-quality 80 -interlace Plane",
      :mini2x => "-quality 80 -interlace Plane",
      :thumb => "-quality 80 -interlace Plane",
      :thumb2x => "-quality 80 -interlace Plane"
    },
    :s3_headers => { 
      'Cache-Control' => 'public, max-age=315576000', 
      'Expires' => 10.years.from_now.httpdate 
    },
    :default_url => "/assets/default.jpg"
  }
  crop_attached_file :image
  
  before_save do |user|
    if user.name.blank?
      n = user.email_address.split('@')[0]
      user.name = n.split(".").join(" ").titleize
    end
  end
  
  before_destroy do |user|
    if user.id == 557 || user.id == 3
      fail "Protected user"
    end
  end
  
  validates :email_address, uniqueness: { case_sensitive: false }, presence: true, email: true
  
  validates_attachment_content_type :image, :content_type => /\Aimage\/.*\Z/
  validates_attachment_size :image, :less_than => 10.megabytes   
    
  attr_accessible :firstName, :lastName, :email_address, :password, :password_confirmation, :companies,
     :image, :timezone, :tutorial_step, :created_at, :language, :beta_access, :news
  
  has_many :hoshins, :through => :companies
  has_many :active_hoshins, -> { active.order "company_id, name" }, :through => :companies, :class_name => "Hoshin", unscoped: true

  has_many :objectives, :dependent => :nullify, :inverse_of => :responsible, foreign_key: :responsible_id
  has_many :indicators, -> { order :next_update }, :dependent => :nullify, :inverse_of => :responsible, foreign_key: :responsible_id
  has_many :indicator_histories, :through => :indicators
  has_many :tasks,  -> { order :deadline }, :dependent => :nullify, :inverse_of => :responsible, foreign_key: :responsible_id
  has_many :dashboard_tasks, -> { includes([:responsible, {:area => :hoshin}, :company])
    .merge(Task.unscoped.active_backlog)
    .merge(Hoshin.unscoped.active)
    .order(:deadline).references(:hoshin, :responsible, {area: :hoshin}, :task) }, :class_name => "Task", foreign_key: :responsible_id
  
  has_many :pending_tasks, -> { pending.includes([:responsible, {:area => :hoshin}, :company])
    .merge(Hoshin.unscoped.active)
    .order(:deadline).references(:hoshin, :responsible) }, :class_name => "Task", foreign_key: :responsible_id
  
  has_many :dashboard_indicators, -> { includes([:responsible, {:area => :hoshin}, :company])
    .merge(Hoshin.unscoped.active)
    .order(:next_update).references(:responsible, :hoshin) }, :class_name => "Indicator", foreign_key: :responsible_id
  
  has_many :pending_indicators, -> { pending.includes([:responsible, {:area => :hoshin}, :company])
    .merge(Hoshin.unscoped.active)
    .order(:next_update).references(:hoshin, :responsible) }, :class_name => "Indicator", foreign_key: :responsible_id
  
  
  has_many :companies, :through => :user_companies, :accessible => true
  has_many :user_companies, :dependent => :destroy 
  has_many :active_user_companies_and_hoshins, -> {by_cname}, :class_name => "UserCompany", unscoped: true
  has_many :authorizations, :dependent => :destroy
  has_many :client_applications, :dependent => :destroy
  has_many :payments, :dependent => :destroy
  
  has_many :my_companies, :class_name => "Company", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_hoshins, :class_name => "Hoshin", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_areas, :class_name => "Area", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_goals, :class_name => "Goal", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_objectives, :class_name => "Objective", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_tasks, :class_name => "Task", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_indicators, :class_name => "Indicator", :inverse_of => :creator, :foreign_key => :creator_id
  has_many :my_indicator_histories, :class_name => "IndicatorHistory", :inverse_of => :creator, :foreign_key => :creator_id
    
  # This gives admin rights and an :active state to the first sign-up.
  before_create do |user|
    if user.class.count == 0
      user.administrator = true
    end
  end
  
  before_save do |user| 
    user.email_address.downcase!
    user.email_address.strip!
    if user.color.nil? && !name.nil?
      user.color = hexFromString(name)
    end
  end
    
  def self.find_by_email_address(email)
    if email.kind_of?(Array)
      User.find_by email_address: email.map{ |s| s.downcase }
    else
      User.find_by email_address: email.downcase
    end
  end
  
  default_scope lambda { 
    if Company.current_id
      where(id: UserCompany.select(:user_id).where(company_id: Company.current_id))
    elsif User.current_id && User.current_id != -1
      where(id: UserCompany.select(:user_id).all)
    end
 }    
       
  TODAY_SQL = "date_trunc('day',now() at time zone coalesce(users.timezone, 'Europe/Berlin'))"
  
  scope :at_hour, lambda { |*hour|
    where("date_part('hour',now() at time zone coalesce(users.timezone, 'Europe/Berlin')) = ?", hour) 
  }
  
  def next_tutorial
    ret = (User.values_for_tutorial_step - tutorial_step).first
    ret.nil? ? [] : ret 
  end
  
  def tutorial_complete?
    ret = next_tutorial.empty?
  end
  
  def available_logged_in
    acting_user unless acting_user.guest?
  end
  
  def backlog_tasks
    tasks.backlog.reorder(:lane_pos)
  end
  def active_tasks
    tasks.active.reorder(:lane_pos)
  end
  def completed_tasks
    tasks.completed.visible.reorder(:lane_pos)
  end
  def discarded_tasks
    tasks.discarded.visible.reorder(:lane_pos)
  end
  
  # --- Signup lifecycle --- #

  lifecycle do

    state :inactive, :default => true
    state :invited
    state :active
    
    create :from_omniauth, :params => [:name, :email_address], :become => :active do
      domain = self.email_address.split("@").last
      Company.unscoped.joins(:company_email_domains).where(company_email_domains: {domain: domain}).each do |company|
        UserCompany::Lifecycle.activate_ij(self, {:user => self, :company => company})
      end
      if (self.companies.blank?) 
        UserCompanyMailer.welcome(self).deliver_later
      end
    end

    create :invite, :params => [:email_address], :become => :invited, :new_key => true  do
        self.email_address = email_address
        UserCompanyMailer.new_invite(lifecycle.key, acting_user, self, acting_user.language.to_s).deliver_later
    end
    
    transition :resend_invite, { :invited => :invited }, :new_key => true do
       UserCompanyMailer.new_invite(lifecycle.key, acting_user, self, acting_user.language.to_s).deliver_later
    end
      
    create :activate_ij,
        :params => [:name, :email_address, :password, :password_confirmation],
        :become => :active
    
    create :signup, :available_to => "Guest",
      :params => [:email_address, :news],
      :become => :inactive, :new_key => true  do
      UserCompanyMailer.activation(self, lifecycle.key).deliver_later
    end
    
    transition :resend_activation, {:invited => :invited}, :available_to => :all, :new_key => true do
      UserCompanyMailer.activation(self, lifecycle.key).deliver_later
    end
    
    transition :resend_activation, {:inactive => :inactive}, :available_to => :all, :new_key => true do
      UserCompanyMailer.activation(self, lifecycle.key).deliver_later
    end
    
    transition :accept_invitation, { :invited => :active }, :available_to => :key_holder,
          :params => [:firstName, :lastName, :password, :language, :timezone] do
      UserCompany.where(user: self, state: :invited).each { |uc|
        uc.lifecycle.activate!(self)
      }
      self.update_column(:key_timestamp, nil)
    end

    transition :activate, { :inactive => :active }, :available_to => :key_holder,
      :params => [:firstName, :lastName, :password, :language, :timezone] do
      current_user = acting_user 
      UserCompanyMailer.welcome(self).deliver_later
    end

    transition :activate, { :invited => :active },
      :params => [:firstName, :lastName, :password, :language, :timezone]  do
      acting_user = self
      @subject = "#{self.name} welcome to Hoshinplan!"
      UserCompanyMailer.invited_welcome(self).deliver_later
    end

    transition :request_password_reset, { :inactive => :inactive }, :new_key => true do
      UserCompanyMailer.activation(self, lifecycle.key).deliver_later
    end

    transition :request_password_reset, { :active => :active }, :new_key => true do
      UserCompanyMailer.forgot_password(self, lifecycle.key).deliver_later
    end

    transition :request_password_reset, { :invited => :invited }, :new_key => true do
      UserCompanyMailer.forgot_password(self, lifecycle.key).deliver_later
    end

    transition :reset_password, { :active => :active }, :available_to => :key_holder,
               :params => [ :password, :password_confirmation ]
               
    transition :reset_password, { :invited => :invited }, :available_to => :key_holder,
              :params => [ :password, :password_confirmation ]

  end
  
  def img_url(size) 
    key = "user-image-" + id.to_s + "-" + size.to_s
    ret = RequestStore.store[key]
    if ret.nil? 
      ret = image.url(size) if image.exists?
      RequestStore.store[key] = ret
    end
    ret
  end
  
  def abbrev
    name.split.map{|x| 
      x[0,1].upcase.tr('^A-Z','')
    }.join() unless name.nil?
  end
  
  def all_active_user_companies_and_hoshins
    return @all_active_user_companies_and_hoshins unless @all_active_user_companies_and_hoshins.nil?
    @all_active_user_companies_and_hoshins = self.active_user_companies_and_hoshins
    ActiveRecord::Associations::Preloader.new.preload(@all_active_user_companies_and_hoshins, 
      [company: :active_hoshins])
    @all_active_user_companies_and_hoshins
  end
  
  def all_companies
    return @all_companies unless @all_companies.nil?
    @all_companies = all_active_user_companies_and_hoshins.map { |c|
      ret = c.company
    }
  end
  
  def all_hoshins
    return @all_hoshins unless @all_hoshins.nil?
    ret = []
      all_active_user_companies_and_hoshins.each { |uc|
          c = uc.company
          next if c.nil? #Should never happen but I see erorrs at New Relic
          c.active_hoshins.each { |h|
            h.company_name = c.name
            ret.push(h)       
        }
      }
      @all_hoshins = ret
  end

  def signed_up?
    state=="active" || state=="invited"
  end
  
  def account_active?
    signed_up?
  end
  
  def self.current_id=(id)
    RequestStore.store[:client_id] = id
  end

  def self.current_id
    RequestStore.store[:client_id]
  end  
  
  def self.current_user
    ret = RequestStore.store[:user]
    if (ret.nil? && !self.current_id.nil?) 
      ret = User.find(self.current_id)
      User.current_user = ret
    end
    ret
  end
  
  def self.current_user=(id)
    RequestStore.store[:user] = id
  end
  
  def flipper_id
    "User:" + id.to_s
  end
  
  # --- Permissions --- #

  def create_permitted?
    # Only the initial admin user can be created
    self.class.count == 0 || acting_user.administrator?
  end

  def update_permitted?
    f = none_changed?(:administrator)
    acting_user.administrator? or 
    (lifecycle.signup_in_progress? && (state == 'invited' || state == 'inactive')) or
    (lifecycle.activate_in_progress? || lifecycle.valid_key? && (state == 'invited' || state == 'inactive')) or 
    (changing_password? && state == 'invited') or
    ((acting_user == self || same_company_admin) && f)
    # Note: crypted_password has attr_protected so although it is permitted to change, it cannot be changed
    # directly from a form submission.
  end

  def destroy_permitted?
    acting_user == self || acting_user.administrator?
  end
  
  def _same_company(cid=nil)
    return false unless self.signed_up?
    acting_user == self || acting_user.user_companies.where(:company_id => self.user_companies.*.company_id).present?
  end
  
  def _same_company_admin(cid=nil)
    return false unless self.signed_up?
    acting_user.user_companies.where(:state => :admin, :company_id => self.user_companies.*.company_id).present?
  end

  def view_permitted?(field)
    (lifecycle.activate_in_progress? || lifecycle.valid_key? && (state == 'invited' || state == 'inactive')) ||
    changing_password? && state == 'invited' ||
    acting_user.administrator? || 
    self.new_record? || 
    self.guest? || 
    same_company
  end
  
  def name
    ret = firstName
    unless lastName.blank?
      ret += " " unless ret.blank? 
      ret += lastName
    end
    ret = ret.blank? ? super : ret
  end
  
  def update_data_from_authorization(provider, uid, email, firstName, lastName, remote_ip, tz, header_locale)
    authorization = Authorization.find_by_provider_and_uid(provider, uid)
    authorization ||= Authorization.find_by_email_address(email)
    atts = authorization.attributes.slice(*User.accessible_attributes.to_a)
    atts['image'].sub!('sz=50', 'sz=416') if atts['image']
    domain = authorization.email_address.split("@").last  
    atts.each { |k, v| 
      atts.delete(k) if !self.attributes[k].blank? || v.nil?
    }
    begin
      self.attributes = atts
    rescue
      self.attributes = atts.delete('photo')
    end
    self.firstName ||= firstName
    self.lastName ||= lastName
    if self.lifecycle.state.name == :invited
      self.lifecycle.activate!(self)
    end
    if self.timezone.nil? && !tz.nil?
   	  zone = tz
   	  zone = Hoshinplan::Timezone.get(zone)
      self.timezone = zone.name unless zone.nil?
    end
    if self.language.nil?
      self.language = header_locale || I18n.locale
    end
    begin
      self.save!
      people_set(self, remote_ip)
    rescue ActiveRecord::RecordInvalid => invalid
      fail ActiveRecord::RecordInvalid, invalid.record.errors.to_yaml if invalid.record && invalid.record.respond_to?('errors')
      fail ActiveRecord::RecordInvalid, invalid.record.to_yaml if invalid.record
      fail ActiveRecord::RecordInvalid, invalid.to_yaml
    end
  end
  
  # Check if the encrypted passwords match
  def authenticated?(password)
    crypted_password == encrypt(password) || crypted_password.blank? && password.blank?
  end
end

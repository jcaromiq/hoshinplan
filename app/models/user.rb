class User < ActiveRecord::Base

  hobo_user_model # Don't put anything above this
  
  NEXT_FRIDAY = DateTime.now.next_week.next_day(4)
  
  include HoboOmniauth::MultiAuth
  
  fields do
    name          :string, :required
    email_address :email_address, :login => true
    image         HoboFields::Types::ImageUrl
    administrator :boolean, :default => false
    timestamps
  end
  attr_accessible :name, :email_address, :password, :password_confirmation, :companies, :image
  

  has_many :objectives, :dependent => :destroy, :inverse_of => :responsible
  has_many :indicators, :dependent => :destroy, :inverse_of => :responsible
  has_many :tasks, :dependent => :destroy, :inverse_of => :responsible
  has_many :companies, :through => :user_companies, :accessible => true
  has_many :user_companies, :dependent => :destroy 
  has_many :authorizations, :dependent => :destroy
  has_many :client_applications, :dependent => :destroy
    
  # This gives admin rights and an :active state to the first sign-up.
  before_create do |user|
    if user.class.count == 0
      user.administrator = true
    end
  end

  # --- Signup lifecycle --- #

  lifecycle do

    state :inactive, :default => true
    state :invited
    state :active
    
    create :from_omniauth, :params => [:name, :email_address], :become => :active do
      @subject = "#{self.name} welcome to Hoshinplan!"
      UserCompanyMailer.welcome(self, 
      @subject).deliver
    end

    create :invite,
      :params => [:name, :email_address, :password, :password_confirmation],
      :become => :invited
    
    create :signup, :available_to => "Guest",
      :params => [:name, :email_address, :password, :password_confirmation],
      :become => :inactive, :new_key => true  do
      UserMailer.activation(self, lifecycle.key).deliver
    end

    transition :activate, { :inactive => :active }, :available_to => :key_holder do
      @subject = "#{self.name} welcome to Hoshinplan!"
      UserCompanyMailer.welcome(self, 
      @subject).deliver
    end

    transition :activate, { :invited => :active } do
      @subject = "#{self.name} welcome to Hoshinplan!"
      UserCompanyMailer.welcome(self, 
      @subject).deliver
    end

    transition :request_password_reset, { :inactive => :inactive }, :new_key => true do
      UserMailer.activation(self, lifecycle.key).deliver
    end

    transition :request_password_reset, { :active => :active }, :new_key => true do
      UserMailer.forgot_password(self, lifecycle.key).deliver
    end

    transition :reset_password, { :active => :active }, :available_to => :key_holder,
               :params => [ :password, :password_confirmation ]

  end

  def signed_up?
    state=="active" || state=="invited"
  end
  
  def account_active?
    signed_up?
  end
  
  def self.current_id=(id)
    Thread.current[:client_id] = id
  end

  def self.current_id
    Thread.current[:client_id]
  end  
  
  def dashboard
    Company.current_id = nil
    {
        "indicators" => self.indicators.unscoped.where("next_update < ? and responsible_id = ?", NEXT_FRIDAY, self.id).order("next_update ASC"),
        "tasks" => self.tasks.unscoped.where("deadline < ? and responsible_id = ?", NEXT_FRIDAY, self.id).order("deadline ASC")
        }
  end
  
  # --- Permissions --- #

  def create_permitted?
    # Only the initial admin user can be created
    self.class.count == 0
  end

  def update_permitted?
    acting_user.administrator? ||
      (acting_user == self && only_changed?(:name, :email_address, :crypted_password,
                                            :current_password, :password, :password_confirmation))
    # Note: crypted_password has attr_protected so although it is permitted to change, it cannot be changed
    # directly from a form submission.
  end

  def destroy_permitted?
    acting_user.administrator?
  end

  def view_permitted?(field)
    true
  end
end

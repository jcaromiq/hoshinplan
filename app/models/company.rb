class Company < ActiveRecord::Base

  include ModelBase
  
  hobo_model # Don't put anything above this
  
  fields do
    name :string
    hoshins_count :integer, :default => 0, :null => false
    plan  :string, :default => 'basic'
    timestamps
  end
  attr_accessible :name, :creator_id
  
  belongs_to :creator, :class_name => "User", :creator => true
  
  has_many :hoshins, -> { order :name }, :dependent => :destroy, :inverse_of => :company
  
  has_many :areas, -> { order :name },:dependent => :destroy, :inverse_of => :company
  has_many :objectives, -> { order :name },:dependent => :destroy, :inverse_of => :company
  has_many :indicators, -> { order :name },:dependent => :destroy, :inverse_of => :company
  has_many :tasks, -> { order :name },:dependent => :destroy, :inverse_of => :company
  
  has_many :users, :through => :user_companies, :accessible => true
  has_many :user_companies, :dependent => :destroy
  
  children :hoshins
  
  before_create do |company|
    cu = User.current_user
    domain = cu.email_address.split("@").last
    if cu.created_at < Date.new(2015,4,4) || domain == 'infojobs.net' || domain == 'scmspain.com' || domain == 'schibsted.com' |
      company.plan = 'UNLIMITED'
    end 
  end
  
  after_create do |company|
    user = User.current_user
    user.tutorial_step << :company
    user.save!
    company.user_companies = [UserCompany::Lifecycle.new_company([company, user], {:user => user, :company => company})]
  end

  default_scope lambda { 
    where("companies.id in (#{UserCompany.select(:company_id).where('user_id=?', User.current_id).to_sql})") unless User.current_user.nil? || User.current_user == -1 || User.current_user.administrator? }
  
  scope :admin, lambda { 
    where(:id => UserCompany.select(:company_id)
      .where('user_id=? and user_companies.state = ?',  
        User.current_id, :admin) ) }
          
  def collaborators=
  end
  
  def self.current_id=(id)
    RequestStore.store[:company_id] = id
  end

  def self.current_id
    RequestStore.store[:company_id]
  end  
  
  def self.current_company=(comp)
    RequestStore.store[:company] = comp
  end
  
  def self.current_company
    ret = RequestStore.store[:company]
    if (ret.nil? && !self.current_id.nil?) 
      ret = Company.find(self.current_id)
      self.current_company = ret
    end
    ret
  end
  
  def comp_users
    ret = RequestStore.store[:comp_users]
    if (ret.nil? && !Company.current_id.nil?) 
      ret = {}
      users.each {|user|
        ret[user.id] = user
      }
      RequestStore.store[:comp_users] = ret
    end
    ret
  end
  
  def all_hoshins
    ret = RequestStore.store[:company_hoshins]
    if (ret.nil? && !Company.current_id.nil?) 
      ret = {}
      hoshins.each {|hoshin|
        ret[hoshin.id] = hoshin
      }
      RequestStore.store[:company_hoshins] = ret
    end
    ret
  end
  
  def collaborator_limits_reached?
    count = user_companies.count
    ret = true
    case plan
    when 'UNLIMITED'
      ret = false
    when 'ENTERPRISE'
      if count<500
        ret = false
      end
    when 'STARTUP'
      if count<20
        ret = false
      end
    end
    return ret
  end

  # --- Permissions --- #

  def create_permitted?
    acting_user.signed_up?
  end

  def update_permitted?
     acting_user.administrator? || same_company_admin(id)
  end

  def destroy_permitted?
     acting_user.administrator? || same_company_admin(id)
  end

  def view_permitted?(field)
    self.new_record? || acting_user.administrator? || same_company(id)
  end

end

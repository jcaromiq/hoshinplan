class Objective < ApplicationRecord

  acts_as_paranoid

  include ModelBase  
  
  hobo_model # Don't put anything above this

  fields do
    name        :string, :null => false
    description HoboFields::Types::TextilePlusString
    neglected    :boolean, :default => false, :required => true
    blind       :boolean, :default => true, :required => true
    timestamps
    deleted_at    :datetime
  end
  index [:deleted_at]
  
  amoeba do
    enable
    include_association :tasks
    include_association :indicators
  end
    
  validates_presence_of :name
    
  attr_accessible :name, :area, :area_id, :description, :responsible, :responsible_id, 
    :indicators, :tasks, :hoshin, :hoshin_id, :parent, :parent_id, :company, :company_id, :creator_id
    
  belongs_to :creator, :class_name => "User", :creator => true  

  has_many :indicators, :dependent => :destroy, :inverse_of => :objective
  has_many :child_indicators, :inverse_of => :parent_objective, :class_name => 'Indicator'
  
  has_many :tasks, -> { order :tsk_pos }, :dependent => :destroy, :inverse_of => :objective
  has_many :child_tasks, :inverse_of => :parent_objective, :class_name => 'Task'
  
  has_many :log, :class_name => "ObjectiveLog", :inverse_of => :objective
  has_many :objective_comments, :inverse_of => :objective

  view_hints.parent  :hoshin
  
  belongs_to :company, :null => false

  belongs_to :parent, :class_name => "Objective"
  belongs_to :area, :inverse_of => :objectives, :null => false
  belongs_to :hoshin, :inverse_of => :objectives, :counter_cache => false, :null => false, :touch => true
  belongs_to :responsible, :class_name => "User", :inverse_of => :objectives

  acts_as_list :scope => :area, :column => "obj_pos"
  
  validate :validate_company
  
  default_scope lambda { 
    where(:company_id => UserCompany.select(:company_id)
      .where('user_id=?',  
        User.current_id)
      ).reorder('obj_pos')
  }
        
  scope :blind, -> {
    indicator = Indicator.arel_table
    objective = Objective.arel_table
    obj2 = arel_table.create_table_alias(objective, :obj2)
    subq_where = obj2[:parent_id].eq(objective[:id]).or(obj2[:id].eq(objective[:id]))
    subq = objective.from(obj2).where(subq_where).project(obj2[:id])

    indicator_cond = includes([:area, :responsible])
    .where(Indicator.unscoped
        .where(indicator[:objective_id].in(subq).and(indicator[:deleted_at].eq(nil)))
        .exists.not).references(:responsible)
  }
  
  scope :neglected, -> { 
    task = Task.arel_table
    objective = Objective.arel_table
    obj2 = arel_table.create_table_alias(objective, :obj2)
    subq_where = obj2[:parent_id].eq(objective[:id]).or(obj2[:id].eq(objective[:id]))
    subq = objective.from(obj2).where(subq_where).project(obj2[:id])
    
    tasks_cond = task[:objective_id].in(subq).and(task[:status].in([:active]))
    indicator = Indicator.arel_table
    ind_cond = indicator[:objective_id].in(subq)
    includes([:area, :responsible])
    .where(Task.unscoped.where(tasks_cond).exists.not)
      .where(Indicator.unscoped.under_tpc(100).where(ind_cond).exists).references(:responsible)
  }
  
  after_destroy do |obj| 
    if obj.deleted_at.present? && obj.obj_pos.present?
      obj.obj_pos = nil
      obj.save!
    end
  end
  
  after_save :update_counter_cache
  after_destroy :update_counter_cache
  def update_counter_cache
    h = self.hoshin
    h.indicators_count = h.indicators.count
    h.save!
  end
          
  before_create do |objective|
    objective.hoshin_id = objective.area.hoshin_id
    objective.company_id = objective.area.company_id
  end
  
  before_create do |obj|
    user = User.current_user
    user.tutorial_step << :objective
    user.save!
  end
  
  before_update do |obj|
    if obj.area_id_changed?
      last_obj = Objective.unscoped.where(area_id: obj.area_id).where.not(obj_pos: nil).order(obj_pos: 'DESC').first
      obj.obj_pos = last_obj.present? ? last_obj.obj_pos + 1 : 1     
    end
  end
  
  after_update do |obj|
    if obj.area_id_changed?
      Indicator.where(:objective_id => id).update_all({:area_id => area_id}) unless obj.indicators.blank?
      Task.where(:objective_id => id).update_all({:area_id => area_id}) unless obj.tasks.blank?
    end
    if obj.parent_changed?
      Task.where(:objective_id => id, :show_on_parent => true).update_all({:parent_area_id => obj.parent.area_id, :parent_objective_id => obj.parent_id})
    end
  end
  
  def status
    ret = :neglected.to_s if neglected
    ret = :blind.to_s if blind
    ret ||= ""
  end
  
  def position
    obj_pos
  end
  
  def area_objectives
    area.objectives
  end
  
  def company_users
    company.users
  end
  
  def parent_hoshin
    ret = hoshin.parent_id unless hoshin.nil?
    ret.nil? ? -1 : ret
  end

  def parent_objectives
    if parent_hoshin.nil? || parent_hoshin < 1 
      result = []
    else
      result = Objective.includes(:area).references(:area).where(hoshin_id: parent_hoshin).reorder('areas.name, objectives.name') unless parent_hoshin < 1
    end
  end
  
  def name_with_area
    area.name + " - " + name
  end
  
  def backlog_tasks
    tasks.backlog.reorder(impact: :desc)
  end
  def active_tasks
    tasks.active.reorder(impact: :desc)
  end
  def completed_tasks
    tasks.completed.visible.reorder(impact: :desc)
  end
  def discarded_tasks
    tasks.discarded.visible.reorder(impact: :desc)
  end
  
  # --- Permissions --- #
  
  def validate_company
    errors.add(:company, "You don't have permissions on this company") unless same_company
  end
  
  def create_permitted?
    acting_user.administrator? || same_company_editor
  end

  def update_permitted?
    acting_user.administrator? || same_company_editor
  end

  def destroy_permitted?
    acting_user.administrator? || same_creator || hoshin_creator || same_company_admin
  end

  def view_permitted?(field)
    acting_user.administrator? || same_company
  end

end

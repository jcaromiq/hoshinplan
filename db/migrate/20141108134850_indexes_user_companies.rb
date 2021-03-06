class IndexesUserCompanies < ActiveRecord::Migration
  def self.up
    remove_index :user_companies, :name => :index_user_companies_on_user_id_and_company_id rescue ActiveRecord::StatementInvalid
    add_index :user_companies, [:company_id, :user_id]
  end

  def self.down
    remove_index :user_companies, :name => :index_user_companies_on_company_id_and_user_id rescue ActiveRecord::StatementInvalid
    add_index :user_companies, [:user_id, :company_id]
  end
end

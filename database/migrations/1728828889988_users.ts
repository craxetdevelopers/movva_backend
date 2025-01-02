import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('first_name').nullable()
      table.string('middle_name').nullable()
      table.string('last_name').nullable()
      table.string('photo').nullable()
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('phone_number').nullable()
      table.string('date_of_birth').nullable()
      table.string('gender').nullable()
      table.string('marital_status').nullable()
      table.string('employment_status').nullable()
      table.string('national_id').nullable()
      table.string('country').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('residential_address').nullable()
      table.string('profession').nullable()
      table.string('status').defaultTo('pending')
      table.string('type').defaultTo('user')
      table.string('verification_otp').nullable()
      table.string('reset_token').nullable()
      table.string('otp_expiry').nullable()
      table.string('reset_token_expiry').nullable()
      table.boolean('email_verified').defaultTo(false)
       /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

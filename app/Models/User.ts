import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, column, hasMany, HasMany, beforeSave } from '@ioc:Adonis/Lucid/Orm'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public firstName: string | null

  @column()
  public middleName: string | null

  @column()
  public lastName: string | null

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public phoneNumber: string | null

  @column()
  public photo: string | any

  @column()
  public gender: string | null

  @column()
  public maritalStatus: string | null

  @column()
  public employmentStatus: string | null

  @column()
  public dateOfBirth: DateTime | null | string

  @column()
  public nationalId: string | null

  @column()
  public country: string | null

  @column()
  public city: string | null

  @column()
  public state: string | null

  @column()
  public residentialAddress: string | null

  @column()
  public profession: string | null

  @column()
  public location: string | null

  @column()
  public status: string | null // For verification status

  @column()
  public verificationOtp: string | null | number

  @column()
  public resetToken: string | null | number

  @column()
  public otpExpiry: DateTime | null | string

  @column()
  public resetTokenExpiry: DateTime | null | string

  @column()
  public emailVerified: boolean

  @column()
  public type: 'user' | 'underwriter' | 'admin'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime | null
    total: any

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

}


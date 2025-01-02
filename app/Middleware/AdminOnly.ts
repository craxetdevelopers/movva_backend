import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AdminOnly {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    const user = auth.user
    if (!user || user.type !== 'admin') {
      return response.unauthorized({ message: 'Admin access only.' })
    }
    await next()
  }
}

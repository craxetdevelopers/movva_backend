import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UnderwriterOnly {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    const user = auth.user
    if (!user || user.type !== 'underwriter') {
      return response.unauthorized({ message: 'Underwriter access only.' })
    }
    await next()
  }
}

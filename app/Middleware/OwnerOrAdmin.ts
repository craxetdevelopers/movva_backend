// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Property from 'App/Models/Property'

export default class OwnerOrAdmin {
  public async handle({ auth, params, response }, next: () => Promise<void>) {
    const user = auth.user
    const property = await Property.find(params.id)

    if (!property) {
      return response.notFound({ message: 'Property not found' })
    }

    if (property.userId !== user.id && user.type !== 'admin') {
      return response.unauthorized({ message: 'Not authorized to perform this action' })
    }

    await next()
  }
}

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

import { DateTime } from 'luxon'
import crypto from 'crypto'
import Mail from '@ioc:Adonis/Addons/Mail'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'

export default class UsersController {


  public async register({ request, response }: HttpContextContract) {
    try {
      // Define validation schema
      const userSchema = schema.create({
        firstName: schema.string({}, [
          rules.required(),
          rules.alpha(), // Ensures that the first name contains only letters
        ]),
        lastName: schema.string({}, [
          rules.required(),
          rules.alpha(), // Ensures that the last name contains only letters
        ]),
        email: schema.string({}, [
          rules.required(),
          rules.email(), // Ensures the email is valid
          rules.unique({ table: 'users', column: 'email' }), // Ensures email is unique
        ]),
        password: schema.string({}, [
          rules.required(),
          rules.minLength(8), // Minimum password length of 8 characters
        ]),
      });
  
      // Validate the request data against the schema
      const userData = await request.validate({
        schema: userSchema,
        messages: {
          'firstName.required': 'First name is required',
          'lastName.required': 'Last name is required',
          'email.required': 'Email is required',
          'email.email': 'Enter a valid email address',
          'email.unique': 'Email already exists',
          'password.required': 'Password is required',
          'password.minLength': 'Password should be at least 8 characters long',
        },
      });
  
      // Create a new user
      const user = new User();
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.email = userData.email;
      user.password = userData.password;
      user.type = request.input('type');
      user.emailVerified = false;
  
      // Save the user to the database
      await user.save();
  
      // Generate OTP (or token for email verification)
      const Otp = crypto.randomInt(100000, 999999);
      user.verificationOtp = Otp;
      user.otpExpiry = DateTime.now().plus({ minutes: 20 }).toSQL();
      await user.save();
  
      // Send verification email
      await Mail.send((message) => {
        message
          .to(user.email)
          .from('support@esote.tech')
          .subject('Email Verification')
          .htmlView('emails/verification', {user: { fullName: request.input('firstName') + " "+ request.input('lastName') }, Otp });
      });
  
      // Return success response
      return response.created({
        message: 'User registered successfully. Please check your email to verify your account.',
      });
    } catch (error) {
      console.error(error);
  
      // Handle validation errors
      if (error.messages) {
        return response.badRequest({ errors: error.messages });
      }
  
      // Return general error response
      return response.internalServerError({
        message: 'An error occurred during registration. Please try again later.',
      });
    }
  }
    
      public async verifyEmail({ request, response }: HttpContextContract) {
        const { email, otp } = request.only(['email', 'otp'])
        const user = await User.findByOrFail('email', email)
    
        if (user.verificationOtp !== otp || !user.otpExpiry  || user.otpExpiry < DateTime.now()) {
          return response.badRequest({ message: 'Invalid or expired OTP' })
        }
    
        user.emailVerified = true
        user.verificationOtp = null
        user.otpExpiry = null
        await user.save()
    
        return response.ok({ message: 'Email verified successfully' })
      }
    
      public async login({ request, auth, response }: HttpContextContract) {
        const { email, password } = request.only(['email', 'password'])
        const user = await User.query().where('email', email).first()
    
        if(!user){
          return response.badRequest({ message: 'Invalid credentials' })
        }
        if (!user.emailVerified) {
          return response.unauthorized({ message: 'Please verify your email before logging in' })
        }
    
        if (!(await Hash.verify(user.password, password))) {
          return response.badRequest({ message: 'Invalid credentials' })
        }
    
        const token = await auth.use('api').generate(user)
        return response.ok({ token , user})
      }
    
      public async forgotPassword({ request, response }: HttpContextContract) {

        try {
            const { email } = request.only(['email'])
            const user = await User.findByOrFail('email', email)
        
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex')
            user.resetToken = resetToken
            user.resetTokenExpiry = DateTime.now().plus({ minutes: 30 }).toSQL()
            await user.save()
        
            // Send reset password email
            await Mail.send((message) => {
              message
                .to(user.email)
                .from('support@esote.tech')
                .subject('Password Reset')
                .htmlView('emails/passwordreset', { user: { fullName: user.firstName + " " + user.lastName }, resetToken })
            })
        
            return response.ok({ message: 'Password reset link sent' })

      } catch (error) {
        response.badRequest(error.message)
      }

      }
    
      public async resetPassword({ request, response }: HttpContextContract) {
        const { token, newPassword } = request.only(['token', 'newPassword'])
        const user = await User.query().where('resetToken', token).firstOrFail()
    
        if (!user.resetTokenExpiry  || user.resetTokenExpiry < DateTime.now()) {
          return response.badRequest({ message: 'Token expired' })
        }
    
        user.password = newPassword
        user.resetToken = null
        user.resetTokenExpiry = null
        await user.save()
    
        return response.ok({ message: 'Password reset successfully' })
      }
    
      public async resendOtp({ request, response }: HttpContextContract) {
        const { email } = request.only(['email'])
        const user = await User.findByOrFail('email', email)
    
        if (user.emailVerified) {
          return response.badRequest({ message: 'Email already verified' })
        }
    
        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999)
        user.verificationOtp = otp
        user.otpExpiry = DateTime.now().plus({ minutes: 10 })
        await user.save()
    
        // Send email
        await Mail.send((message) => {
          message
            .to(user.email)
            .from('support@esote.tech')
            .subject('Resend Email Verification')
            .htmlView('emails/verification', { user, otp })
        })
    
        return response.ok({ message: 'OTP resent successfully' })
      }



      public async updateProfile({ request, response, auth }: HttpContextContract) {
        try {
          // Authenticate the user
          const user = await auth.authenticate()
    
          // Define validation schema
          const updateSchema = schema.create({
            firstName: schema.string.optional({}, [
              rules.alpha(),
            ]),
            lastName: schema.string.optional({}, [
              rules.alpha(),
            ]),
            phoneNumber: schema.string.optional({}, [
              rules.mobile(),
            ]),
            dateOfBirth: schema.date.optional(),
            residentialAddress: schema.string.optional(),
            maritalStatus: schema.string.optional(),
            country: schema.string.optional(),
            city: schema.string.optional(),
            state: schema.string.optional(),
            profession: schema.string.optional(),
            gender: schema.string.optional(),
            employmentStatus: schema.string.optional(), // New field for employment status
            nationalId: schema.string.optional({}, [rules.minLength(6)]), // New field for national ID
            photo: schema.file.optional({
              extnames: ['jpg', 'jpeg', 'png'],
              size: '2mb',
            }),
          })
    
          // Validate request data
          const validatedData = await request.validate({ schema: updateSchema })
    
          // Handle photo upload if present
          if (validatedData.photo) {
            const photoFile = validatedData.photo
    
            // Upload the photo to Cloudinary
            const result = await cloudinary.uploader.upload(photoFile.tmpPath!, {
              folder: 'user_photos',
            })
    
            // Delete the temporary file after upload
            await fs.unlink(photoFile.tmpPath!)
    
            // Set the Cloudinary URL directly to the user's photo field
            user.photo = result.secure_url
          }
    
          // Remove `photo` from `validatedData` before merging, as it's already handled
          delete validatedData.photo
    
          // Merge other validated data
          user.merge(validatedData)
          await user.save()
    
          return response.ok({ message: 'Profile updated successfully', user })
        } catch (error) {
          console.error(error)
          return response.badRequest({
            message: 'Failed to update profile',
            errors: error.messages || error.message,
          })
        }
      }


     


      /**
   * Get all users (Admin-only).
   */
  public async getAllUsers({ auth, request, response }: HttpContextContract) {
    const user = auth.user
    if (!user || user.type !== 'admin') {
      return response.unauthorized({ message: 'You are not authorized to perform this action.' })
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await User.query().orderBy('created_at', 'desc').paginate(page, limit)

    return response.ok(users)
  }

 
}

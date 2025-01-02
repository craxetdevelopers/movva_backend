/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})



Route.group(() => {
  

  // User Registration
  Route.post('/register', 'UsersController.register')

  // Email Verification
  Route.post('/verify-email', 'UsersController.verifyEmail')

  // Login
  Route.post('/login', 'UsersController.login')

  // Forgot Password
  Route.post('/forgot-password', 'UsersController.forgotPassword')

  // Reset Password
  Route.post('/reset-password', 'UsersController.resetPassword')
  
  // Resend OTP
  Route.post('/resend-otp', 'UsersController.resendOtp')
 
  
  Route.group(() => {



    //User Update profile 
    Route.put('/user/profile', 'UsersController.resendOtp')



    // Admin-only endpoint to approve or reject an application
    Route.get('/users', 'UsersController.getAllUsers').middleware('adminOnly')
   

  }).middleware('auth')



}).prefix('v1')

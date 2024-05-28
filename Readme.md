# Chaloge-sath-mai

Chaloge sath mai is simple carpooling application with all basic features like secure authentication, ride listings, booking, rating, and seeing archive rides.
+ **Jwt-authentication:** Used jwt token based authentication, where client will be receiving accessToken and refreshToken.
+ **Avatar upload an managemnet:** Avatar can be uploaded, at backend videos are being saved locally first for sake of all field's validations using multer, and further will get uploaded to cloudinary.
+ **Trips:** Users can publish, view, and cancel trips. They can also search for trips with various conditions, such as whether the driver allows pets or smoking.
+ **Booking:** A user can see all their booking or a particular one, and they can cancel it also.


### Controllers:
+ **User controller:**
    + `changePassword`: To change password.
    + `getUserById`: A user can view other's profiles and informations, like total rides published or seeing all the reviews that the user get
    + `userCurrentProfile`: A user can view own profile.
    + `loginUser`: Login, email/username and password.
    + `logoutUser`: User can logout.
    + `userRefreshAccessToken`: This will generate and provide new accessToken and refreshToken.
    + `registerUser`: registering the new user.
    + `userUpdateAvatar`: To update avatar picture.
    + `getArchiveTrips`: A user can see all his previous booking and trips details.
    + `sendCodeForForgetPassword`: A user can reset it password if it forget, by getting a otp in email using Resend.
    + `verifyCodeForEmail`: A user can verify it's email so that travellers can see that the profile details are genuine. To verify it we send a otp through `sendCodeForEmail` controller using Resend.
    + `verifyCodeForNumber`: A user can verify it's number so that travellers can see that the profile details are genuine. To verify it we send a otp through `sendCodeForNumber` controller using Twilio.


+ **Trip controller:**
    + `createTrip`: To create a new Trip.
    + `getAtrip`: A user can view information about trip, like how many have already booked, what prefrence driver is like if the driver would like allow to smoke in the car or not.
    + `getAlltrips`: A user can view all the trips on the particular and sort them how he/she would like.
    + `updateAtrip`: When driver want to update the information about trip, it will give this info to all the travellers who have booked this trip.
    + `bookYourTrip`: User can book a trip and after this the driver will be informed.
    + `cancelYourTrip`: User can cancel the whole trip, and this information will be shared will all the travellers who have booked this trip.
    + `cancelOthersTrip`: User can cancel the booking of the traveller in their trip.

+ **Booking controller:**
    + `getAllYourBookings`: User can see all his booking including trips which he have created.
    + `showBooking`: A user can see a particular booking in detail.
    + `cancelYourBooking`: A user can cancel it's booking, and it will also automatically share this information with the driver.

+ **Rating controller:**
    + `getAllRatings`: Retrieves all ratings from the database for the particular user.
    + `getARating`: A user can give a rating.
    + `updateRating`: A user can update it's previous rating.
    + `deleteRating`: A user can delete it's rating.

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userForPasswordResetSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    currentOtp : {
        type : String,
        default : ""
    }
    
})

userForPasswordResetSchema.pre('save', async function (next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 12)
     }
    next();
})

const User = mongoose.model('PASSWORDRESET', userForPasswordResetSchema);

export default User
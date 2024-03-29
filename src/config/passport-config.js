import passport from 'passport'
import local from 'passport-local'
import userModel from './../dao/mongodb/models/user-model.js'
import cartModel from './../dao/mongodb/models/carts-model.js'
import { createHash, validatePassword } from './../utils.js'
import GitHubStrategy from 'passport-github2'

const LocalStrategy = local.Strategy;

export const initializePassport = () => {
    passport.use('register', new LocalStrategy(
        { passReqToCallback: true, usernameField: 'email' }, 
        async (req, username, password, done) =>{
            const { first_name, last_name, email, age } = req.body
            try {
                let user = await userModel.findOne({ email: username })
                if(user){
                    return done(null, false)
                }
                
                let newCart = {}
                newCart = await cartModel.create(newCart)

                let role = 'user'
                const newUser = {
                        first_name,
                        last_name,
                        email,
                        age,
                        password: createHash(password),
                        cart: newCart,
                        role,
                }

                let result = await userModel.create(newUser)
                return done(null, result)
            } catch (error) {
                return done(`Error getting user: ${ error }`)
            }
        }
    ))

    passport.serializeUser((user,done) => {
        done(null, user._id)
    })
    
    passport.deserializeUser( async (id , done) => {
        let user = await userModel.findById(id)
        done(null, user)
    })

    passport.use('login', new LocalStrategy({ usernameField: 'email' }, async (username, password, done) => {
        try {
           const user = await userModel.findOne({ email: username })
            if(!user){
                return done(null, false)
            }
            if(!validatePassword(password, user)) {
                return done (null, false)
            }
            return done(null, user)

        } catch (error) {
            return done(`Error trying to login: ${ error }`)
            
        }

    }))
}

export const initGithub = () => {
    passport.use('github', new GitHubStrategy({
        clientID:'Iv1.8c76f5511d5dd00d',
        clientSecret:'5ef1bba4837cf85dca8c9a99740a5f1fdfdbb1c1',
        callbackURL: 'http://localhost:8080/api/session/githubcallback',

    }, async (accesToken, refreshToken, profile, done) => {
        try {
            let user = await userModel.findOne({ email: profile._json.email })

            if(!user){
                let newCart = {}
                newCart = await cartModel.create(newCart)

                const newUser = {
                        first_name: profile.displayName,
                        last_name: null,
                        email: profile._json.email,
                        age: null,
                        password: '',
                        cart: newCart,
                        role: 'user'
                }
                const result = await userModel.create(newUser);
                done(null, result)
            } else {
                done(null, user)
            }
        } catch (error) {
            return done(null, error)
        }
        passport.serializeUser((user,done) => {
            done(null, user._id)
        })
        
        passport.deserializeUser( async (id , done) => {
            let user = await userModel.findById(id)
            done(null, user)
        })
    }))
}
import bcrypt from "bcrypt"
import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
    const { username, email, password } = req.body

    try {
        // hashing the password.. will use bcrypt
        const hashedPassword = await bcrypt.hash(password, 10)
        // create new user and add to db
        console.log(hashedPassword)
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        })
        console.log(newUser)
        res.status(201).json({ message: "User Created." })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "user creation failed" })
    }

}

export const login = async (req, res) => {
    const {username, password} = req.body
    try{
        // 1. Check if user exists 
        const user = await prisma.user.findUnique({
            where:{username}
        })
        if(!user) return res.status(401).json({message:"Invalid Credentials! Please try again."})

        // 2. Check Password 
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid) return res.status(401).json({message:"bad credentials"})

        // 3. Generate Cookie token

        const age = 1000 * 60 * 60 * 24 * 30   // 30 days

        const token = jwt.sign({
                id: user.id,
                isAdmin: false
            }, process.env.JWT_SECRET_KEY, {expiresIn: age}
        )

        const {password: userPassword, ...userInfo} = user


        res.cookie("token", token,{
            httpOnly: true,
            // secure: true not usable in localhost
            maxAge: age,
        }).status(200)
        .json(userInfo)

    } catch(err){
        console.log(err) 

        res.status(500).json({message: "login failed"})
    }
}

export const logout = (req, res) => {
    // clear cookie to logout
    res.clearCookie("token").status(200).json({message: "Logged out"})
}
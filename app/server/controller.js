module.exports = {
    createServer: async(req, res) => {
        try {
            const { serverName, desc, category } = req.body

            if(!serverName || !desc || !category) {
                return res.status(400).json({ message: "u must fill in all!" })
            }


        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    }
}
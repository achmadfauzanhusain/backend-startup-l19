module.exports = {
    createPost: async(req, res) => {
        try {
            const { caption } = req.body

            
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}
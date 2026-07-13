module.exports = {
    test: async(req, res) => {
        try {
            res.status(200).json({ message: "Test successful" });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
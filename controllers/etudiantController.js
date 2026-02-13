const mongoose = require('mongoose');
const Etudiant = require('../models/Etudiant');


// =====================================================
// CREATE - Ajouter un étudiant
// Route: POST /api/etudiants
// =====================================================
exports.createEtudiant = async (req, res) => {
    try {
        const { nom, prenom } = req.body;

        // Vérifier doublon nom + prenom
        const existing = await Etudiant.findOne({ nom, prenom });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Un étudiant avec ce nom et prénom existe déjà"
            });
        }

        const etudiant = await Etudiant.create(req.body);

        res.status(201).json({
            success: true,
            message: "Étudiant créé avec succès",
            data: etudiant
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email déjà utilisé"
            });
        }

        res.status(400).json({
            success: false,
            message: "Données invalides",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL - Pagination + Sorting + Field selection
// Route: GET /api/etudiants
// =====================================================
exports.getAllEtudiants = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const sort = req.query.sort || "nom";
        const fields = req.query.fields?.split(',').join(' ');

        const etudiants = await Etudiant.find()
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .select(fields);

        const total = await Etudiant.countDocuments();

        res.status(200).json({
            success: true,
            page,
            total,
            count: etudiants.length,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};


// =====================================================
// GET ONE BY ID
// Route: GET /api/etudiants/:id
// =====================================================
exports.getEtudiantById = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID invalide"
            });
        }

        const etudiant = await Etudiant.findById(id);

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        res.status(200).json({
            success: true,
            data: etudiant
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE
// Route: PUT /api/etudiants/:id
// =====================================================
exports.updateEtudiant = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID invalide"
            });
        }

        // 🔒 allow only specific fields
        const allowedFields = ['nom', 'prenom', 'email', 'filiere', 'annee', 'moyenne', 'actif'];
        const updates = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        // 🔒 Check duplicate nom + prenom
        if (updates.nom && updates.prenom) {
            const duplicate = await Etudiant.findOne({
                nom: updates.nom,
                prenom: updates.prenom,
                _id: { $ne: id }
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "Un autre étudiant avec ce nom et prénom existe déjà"
                });
            }
        }

        const etudiant = await Etudiant.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        res.status(200).json({
            success: true,
            message: "Étudiant mis à jour avec succès",
            data: etudiant
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur de mise à jour",
            error: error.message
        });
    }
};


// =====================================================
// DELETE
// Route: DELETE /api/etudiants/:id
// =====================================================
exports.deleteEtudiant = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID invalide"
            });
        }

        const etudiant = await Etudiant.findByIdAndDelete(id);

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        res.status(200).json({
            success: true,
            message: "Étudiant supprimé avec succès"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};


// =====================================================
// SEARCH BY FILIERE (case insensitive)
// Route: GET /api/etudiants/filiere/:filiere
// =====================================================
exports.getEtudiantsByFiliere = async (req, res) => {
    try {
        const filiere = req.params.filiere;

        const etudiants = await Etudiant.find({
            filiere: new RegExp(`^${filiere}$`, 'i')
        });

        res.status(200).json({
            success: true,
            count: etudiants.length,
            filiere,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};


// =====================================================
// ADVANCED SEARCH
// Route: GET /api/etudiants/search/advanced
// =====================================================
exports.advancedSearch = async (req, res) => {
    try {
        const { nom, filiere, anneeMin, anneeMax, moyenneMin } = req.query;

        let filter = { actif: true };

        if (nom) filter.nom = new RegExp(nom, 'i');

        if (filiere) {
            filter.filiere = new RegExp(`^${filiere}$`, 'i');
        }

        if (anneeMin || anneeMax) {
            filter.annee = {};
            if (anneeMin) filter.annee.$gte = parseInt(anneeMin);
            if (anneeMax) filter.annee.$lte = parseInt(anneeMax);
        }

        if (moyenneMin) {
            filter.moyenne = { $gte: parseFloat(moyenneMin) };
        }

        const etudiants = await Etudiant.find(filter).sort("nom");

        res.status(200).json({
            success: true,
            filters: req.query,
            count: etudiants.length,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

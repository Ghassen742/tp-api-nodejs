// Importer le modèle Etudiant
const Etudiant = require('../models/Etudiant');

// ============================================
// CREATE - Créer un nouvel étudiant
// Route: POST /api/etudiants
// ============================================
exports.createEtudiant = async (req, res) => {
    try {
        console.log('📥 Données reçues:', req.body);

        const { nom, prenom } = req.body;

        // 🔒 Vérifier si un étudiant avec le même nom + prénom existe déjà
        const etudiantExiste = await Etudiant.findOne({ nom, prenom });

        if (etudiantExiste) {
            return res.status(400).json({
                success: false,
                message: 'Un étudiant avec ce nom et prénom existe déjà'
            });
        }

        // Créer l'étudiant
        const etudiant = await Etudiant.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Étudiant créé avec succès',
            data: etudiant
        });

    } catch (error) {

        // Email déjà existant (si unique dans le schéma)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Cet email existe déjà'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Données invalides',
            error: error.message
        });
    }
};

// ============================================
// READ ALL - Récupérer tous les étudiants
// Route: GET /api/etudiants
// ============================================
exports.getAllEtudiants = async (req, res) => {
    try {
        const etudiants = await Etudiant.find();

        res.status(200).json({
            success: true,
            count: etudiants.length,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// READ ONE - Récupérer un étudiant par ID
// Route: GET /api/etudiants/:id
// ============================================
exports.getEtudiantById = async (req, res) => {
    try {
        console.log('🔍 Recherche ID:', req.params.id);

        const etudiant = await Etudiant.findById(req.params.id);

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: etudiant
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// UPDATE - Mettre à jour un étudiant
// Route: PUT /api/etudiants/:id
// ============================================
exports.updateEtudiant = async (req, res) => {
    try {
        console.log('✏️ Mise à jour ID:', req.params.id);
        console.log('📥 Nouvelles données:', req.body);

        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Étudiant mis à jour avec succès',
            data: etudiant
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur de mise à jour',
            error: error.message
        });
    }
};

// ============================================
// DELETE - Supprimer un étudiant
// Route: DELETE /api/etudiants/:id
// ============================================
exports.deleteEtudiant = async (req, res) => {
    try {
        console.log('🗑️ Suppression ID:', req.params.id);

        const etudiant = await Etudiant.findByIdAndDelete(req.params.id);

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Étudiant supprimé avec succès',
            data: {}
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ============================================
// SEARCH - Rechercher par filière
// Route: GET /api/etudiants/filiere/:filiere
// ============================================
exports.getEtudiantsByFiliere = async (req, res) => {
    try {
        console.log('🔎 Filière:', req.params.filiere);

        const etudiants = await Etudiant.find({
            filiere: req.params.filiere
        });

        res.status(200).json({
            success: true,
            count: etudiants.length,
            filiere: req.params.filiere,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

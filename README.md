# ADAPT'AUTO LAB — Phase 1

## 1. Base de données (Supabase)
1. Supabase → SQL Editor → New query : collez tout `supabase/01_phase1.sql` → Run.
2. Authentication → Providers → Email : désactivez « Confirm email » pour les tests.
3. Authentication → URL Configuration : Site URL = votre adresse Vercel ; Redirect URLs = cette adresse + `/**`.

## 2. Code (GitHub → Vercel)
Envoyez TOUS les fichiers de ce dossier dans le dépôt (dossier `src` inclus, jamais de `.env`).
Variables Vercel : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Puis Deploy.

## 3. Devenir administrateur
1. Sur le site, créez votre compte.
2. Supabase → SQL Editor (avec VOTRE e-mail) :
   update public.profiles set role='admin' where id = (select id from auth.users where email='votre@email.com');
3. Déconnectez-vous puis reconnectez-vous : vous arrivez sur l'espace administrateur.

## Liste de contrôle Phase 1
- [ ] Création de compte élève → « Mon espace »
- [ ] Un élève qui ouvre /admin est renvoyé vers /eleve
- [ ] Après déconnexion, /eleve renvoie vers /login
- [ ] Mot de passe oublié : e-mail reçu, le lien ouvre « Nouveau mot de passe »
- [ ] Compte admin → « Espace administrateur » avec le nombre d'élèves
- [ ] Affichage correct sur téléphone

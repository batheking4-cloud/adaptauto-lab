-- Supprime tous les contenus d'exemple (questions, mini-jeux, examens marqués [EXEMPLE])
delete from public.quizzes where is_demo;
delete from public.questions where is_demo;

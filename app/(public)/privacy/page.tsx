export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#F4F4F6',
      fontFamily: "'DM Sans', sans-serif",
      padding: '4rem 1.5rem',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#4646FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>
              Social IA
            </span>
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '2rem', fontWeight: 800, marginBottom: '.75rem', letterSpacing: '-.03em' }}>
            Politique de confidentialité
          </h1>
          <p style={{ color: '#8E8E98', fontSize: '.9rem' }}>Dernière mise à jour : mars 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: '#C4C4CC', lineHeight: 1.75, fontSize: '.95rem' }}>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              1. Introduction
            </h2>
            <p>
              Social IA ("nous", "notre") est une application SaaS de gestion et de publication de contenu sur les réseaux sociaux.
              Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles
              lorsque vous utilisez notre service.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              2. Données collectées
            </h2>
            <p>Nous collectons les données suivantes :</p>
            <ul style={{ marginTop: '.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li>Adresse e-mail et informations de profil</li>
              <li>Informations de profil de marque (nom, description, secteur)</li>
              <li>Contenu des posts créés ou générés via l'application</li>
              <li>Tokens d'accès aux réseaux sociaux connectés (chiffrés)</li>
              <li>Données d'utilisation et statistiques de performance des posts</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              3. Utilisation des données
            </h2>
            <p>Vos données sont utilisées pour :</p>
            <ul style={{ marginTop: '.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li>Fournir et améliorer le service Social IA</li>
              <li>Générer du contenu personnalisé via l'intelligence artificielle</li>
              <li>Publier et programmer vos posts sur les réseaux sociaux connectés</li>
              <li>Vous envoyer des notifications liées à votre compte</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              4. Connexion aux réseaux sociaux (Meta)
            </h2>
            <p>
              Lorsque vous connectez votre compte Instagram ou Facebook, nous accédons aux permissions suivantes :
            </p>
            <ul style={{ marginTop: '.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li><strong style={{ color: '#F4F4F6' }}>instagram_basic</strong> — lire les informations de base du profil</li>
              <li><strong style={{ color: '#F4F4F6' }}>instagram_content_publish</strong> — publier des posts sur Instagram</li>
              <li><strong style={{ color: '#F4F4F6' }}>pages_manage_posts</strong> — gérer les publications sur vos Pages Facebook</li>
              <li><strong style={{ color: '#F4F4F6' }}>pages_read_engagement</strong> — lire les statistiques d'engagement</li>
              <li><strong style={{ color: '#F4F4F6' }}>pages_show_list</strong> — accéder à la liste de vos Pages</li>
            </ul>
            <p style={{ marginTop: '.75rem' }}>
              Nous ne vendons jamais vos données à des tiers. Les tokens d'accès sont chiffrés et stockés de manière sécurisée.
              Vous pouvez révoquer l'accès à tout moment depuis les paramètres de votre compte.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              5. Sécurité des données
            </h2>
            <p>
              Toutes les données sont stockées sur Supabase (infrastructure sécurisée). Les tokens d'accès aux réseaux sociaux
              sont chiffrés avant stockage. Nous utilisons HTTPS pour toutes les communications.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              6. Vos droits
            </h2>
            <p>Vous avez le droit de :</p>
            <ul style={{ marginTop: '.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li>Accéder à vos données personnelles</li>
              <li>Corriger vos données inexactes</li>
              <li>Supprimer votre compte et toutes vos données</li>
              <li>Révoquer l'accès aux réseaux sociaux connectés</li>
              <li>Exporter vos données</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>
              7. Contact
            </h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles,
              contactez-nous à : <strong style={{ color: '#4646FF' }}>privacy@social-ia.com</strong>
            </p>
          </section>

        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1C1C21', color: '#52525C', fontSize: '.82rem' }}>
          © 2026 Social IA. Tous droits réservés.
        </div>

      </div>
    </div>
  )
}

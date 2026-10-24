import streamlit as st
import requests
import pandas as pd

# 1. Structural Page Configurations & Dynamic Dashboard Title
st.set_page_config(page_title="FPL Premium Dashboard", layout="wide")

# 2. Bespoke Premium CSS Theme Injection
st.markdown("""
<style>
    /* Premium Midnight Gradient Background Framework */
    .stApp {
        background: radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 100%) !important;
        color: #f8fafc !important;
        font-family: 'Inter', -apple-system, sans-serif;
    }
    
    /* Modern Grid Layout Container */
    .dashboard-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
    }
    
    /* Custom Glassmorphism UI Cards */
    .fpl-card {
        background: rgba(30, 41, 59, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    /* Text Typography Rules */
    .card-meta {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #94a3b8;
        font-weight: 700;
        margin-bottom: 8px;
    }
    .card-value {
        font-size: 28px;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.2;
    }
    .card-subtitle {
        font-size: 14px;
        color: #cbd5e1;
        margin-top: 6px;
    }
    .highlight-text {
        color: #fbbf24; /* Golden Accent */
    }
</style>
""", unsafe_allow_html=True)

# 3. Structural Header Layout Presentation
st.title("FantasyNPL Hub - Sagarmatha League Season")
st.markdown("Real-time automated summaries, true isolated gameweek performance counters, and standings.")
st.write("---")

# 4. Sidebar Configuration Panels
st.sidebar.header("Configuration")
input_id = st.sidebar.text_input("FPL Classic League ID", value="1056457")
clean_league_id = str(input_id).strip().replace(" ", "")

if clean_league_id:
    # Decoupled Core Endpoints
    domain_base = "https://fantasy.premierleague.com"
    api_folder = "/api/leagues-classic/"
    endpoint_suffix = "/standings/"
    
    final_fpl_url = f"{domain_base}{api_folder}{clean_league_id}{endpoint_suffix}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        # Request data via background Python framework to prevent CORS issues
        response = requests.get(final_fpl_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            league_name = data['league']['name']
            managers = data['standings']['results']
            
            # Map raw arrays into a dynamic tabular processing layout
            df = pd.DataFrame(managers)
            
            # Clean and structure layout variables
            df_display = df[['rank', 'entry_name', 'player_name', 'event_total', 'total']].copy()
            df_display.columns = ['Rank', 'Team Name', 'Manager', 'GW Points', 'Total Points']
            
            # 5. SAFE GAMEWEEK CALCULATION
            # Isolates the highest single 'GW Points' score registered natively within this specific week
            top_gw_row = df_display.loc[df_display['GW Points'].idxmax()]
            
            # Calculate Overall League Leader (Absolute Rank 1)
            leader_row = df_display.loc[df_display['Rank'] == 1].iloc[0]
            
            # 6. RENDER THE PREMIUM UI CARDS WITH REAL DATA
            st.markdown(f"""
            <div class="dashboard-container">
                <div class="fpl-card">
                    <div class="card-meta">👑 CURRENT WEEK WINNER</div>
                    <div class="card-value highlight-text">{top_gw_row['Manager']}</div>
                    <div class="card-subtitle">{top_gw_row['Team Name']} • <strong>{top_gw_row['GW Points']} Pts</strong></div>
                </div>
                <div class="fpl-card">
                    <div class="card-meta">🥇 LEAGUE LEADER</div>
                    <div class="card-value">{leader_row['Manager']}</div>
                    <div class="card-subtitle">{leader_row['Team Name']} • <strong>{leader_row['Total Points']} Total Pts</strong></div>
                </div>
                <div class="fpl-card">
                    <div class="card-meta">⚽ LEAGUE SCALE</div>
                    <div class="card-value" style="color: #34d399;">{len(df_display)} Managers</div>
                    <div class="card-subtitle">Active inside: {league_name}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # 7. Render Dynamic, Interactive Table Underneath
            st.subheader("📊 Full Standings Leaderboard")
            st.dataframe(df_display, use_container_width=True, hide_index=True)
            
        else:
            st.error(f"FPL Server error status code: {response.status_code}")
            
    except Exception as e:
        st.error(f"An unexpected loading error occurred: {str(e)}")

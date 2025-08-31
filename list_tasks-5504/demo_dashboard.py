#!/usr/bin/env python3
"""
Demo do Dashboard Claude-CTO
Versão simplificada para demonstração rápida
"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import plotly.express as px

st.set_page_config(page_title="Claude-CTO Demo", page_icon="🤖", layout="wide")

st.markdown("# 🤖 Claude-CTO Dashboard - Demo")

# Dados de demonstração
demo_tasks = [
    {"id": 1, "task_identifier": "refactor_auth", "status": "RUNNING", "progress": 75, "created_at": datetime.now() - timedelta(minutes=10)},
    {"id": 2, "task_identifier": "update_deps", "status": "COMPLETED", "progress": 100, "created_at": datetime.now() - timedelta(hours=1)},
    {"id": 3, "task_identifier": "fix_security", "status": "FAILED", "progress": 30, "created_at": datetime.now() - timedelta(minutes=45)},
    {"id": 4, "task_identifier": "generate_docs", "status": "PENDING", "progress": 0, "created_at": datetime.now() - timedelta(minutes=5)}
]

# Métricas
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total", 4)
col2.metric("Executando", 1) 
col3.metric("Completadas", 1)
col4.metric("Falharam", 1)

st.markdown("---")

# Tabela de tarefas
st.subheader("📋 Tarefas")
df = pd.DataFrame(demo_tasks)
df['elapsed'] = df['created_at'].apply(lambda x: f"{int((datetime.now() - x).total_seconds() / 60)}min")

for _, task in df.iterrows():
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        status_color = {"RUNNING": "blue", "COMPLETED": "green", "FAILED": "red", "PENDING": "gray"}[task['status']]
        st.markdown(f"**{task['task_identifier']}** ::{status_color}[{task['status']}]")
    
    with col2:
        st.write(f"⏱️ {task['elapsed']}")
        
    with col3:
        if task['status'] == 'RUNNING':
            st.progress(task['progress'] / 100)

# Gráfico
st.subheader("📊 Status Distribution")
status_counts = df['status'].value_counts()
fig = px.pie(values=status_counts.values, names=status_counts.index)
st.plotly_chart(fig, use_container_width=True)

st.markdown("---")
st.info("💡 **Demo**: Este é um exemplo com dados simulados. Use `run_dashboard.sh` para a versão completa!")
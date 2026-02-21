import streamlit as st

st.set_page_config(page_title="Yale Insulin Calculator", page_icon="💉")

st.title("Yale Insulin Infusion Calculator")
st.markdown("### Clinical Decision Support for ICU Settings")

# Sidebar for Initial Setup
target_low = st.sidebar.number_input("Target BG Low (mg/dL)", value=100)
target_high = st.sidebar.number_input("Target BG High (mg/dL)", value=140)

# Main Inputs
col1, col2 = st.columns(2)
with col1:
    current_bg = st.number_input("Current BG (mg/dL)", min_value=0, value=160)
    current_rate = st.number_input("Current Insulin Rate (units/hr)", min_value=0.0, value=2.0)
with col2:
    prev_bg = st.number_input("Previous BG (mg/dL)", min_value=0, value=180)
    
delta_bg = current_bg - prev_bg

st.divider()

# Logic Implementation
if current_bg < 70:
    st.error("🛑 **CRITICAL: HYPOGLYCEMIA**")
    st.write("1. **STOP** insulin infusion.")
    st.write("2. Give 25g (50mL) D50 IV.")
    st.write("3. Recheck BG in 15 mins.")
elif 70 <= current_bg < 100:
    st.warning("**BG BELOW TARGET**")
    st.write(f"Reduce rate by 50%. New Rate: **{current_rate * 0.5} units/hr**")
elif current_bg > target_high:
    if delta_bg >= 0:
        st.success(f"BG increasing or stable. Increase rate to **{current_rate + 1.0} units/hr**")
    elif -30 <= delta_bg < 0:
        st.info("BG dropping slowly. Maintain current rate.")
    else:
        st.info("BG dropping rapidly (>30 mg/dL). Consider reducing rate.")
else:
    st.success("✅ **BG WITHIN TARGET RANGE**")
    st.write("Maintain current infusion rate.")

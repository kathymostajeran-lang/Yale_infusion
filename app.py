import streamlit as st

# Helper function to round to the nearest 0.5
def round_to_half(val):
    return round(val * 2) / 2

# Helper function to get Delta and 2*Delta based on current rate
def get_deltas(rate):
    if rate < 3.0: return 0.5, 1.0
    elif rate < 6.5: return 1.0, 2.0   # Covers 3.0 - 6.0
    elif rate < 10.0: return 1.5, 3.0  # Covers 6.5 - 9.5
    elif rate < 15.0: return 2.0, 4.0  # Covers 10 - 14.5
    elif rate < 20.0: return 3.0, 6.0  # Covers 15 - 19.5
    elif rate < 25.0: return 4.0, 8.0  # Covers 20 - 24.5
    else: return 5.0, 10.0             # >= 25 (consult MD)

st.title("Insulin Infusion Calculator")

# 1. Target BG Text and PDF Link
st.markdown("### **Target blood glucose level is 100-139 mg/dL.**")
st.markdown("[📄 Click here to view the Yale Insulin Infusion Protocol PDF](https://your-link-to-pdf.com)")
st.caption("*Note: Calculations assume hourly rate of change (last BG measured 1 hr ago).*")

st.divider()

# 2. Initial Insulin Dosing
st.header("Initial Dosing")
st.caption("For patients starting the infusion.")
init_bg = st.number_input("Initial Blood Glucose (mg/dL)", min_value=0, value=200, step=1, key="init_bg")

if st.button("Calculate Initial Dose"):
    initial_dose = round_to_half(init_bg / 100)
    st.success(f"**Initial Bolus:** {initial_dose} U")
    st.success(f"**Initial Infusion Rate:** {initial_dose} U/hr")

st.divider()

# 3. Stacked Inputs for Maintenance 
st.header("Maintenance & Rate Adjustment")

prev_bg = st.number_input("Previous Blood Glucose (mg/dL)", min_value=0, value=180, step=1)
curr_bg = st.number_input("Current Blood Glucose (mg/dL)", min_value=0, value=250, step=1)
curr_rate = st.number_input("Current Insulin Rate (U/hr)", min_value=0.0, value=5.0, step=0.5)

if st.button("Calculate New Rate"):
    
    bg_change = curr_bg - prev_bg
    delta, two_delta = get_deltas(curr_rate)
    
    # Critical Lows (< 75 mg/dL)
    if curr_bg < 50:
        st.error("**CRITICAL: D/C INSULIN INFUSION**\n\nGive 1 amp (25 g) D50 IV; recheck BG q 15 minutes. When BG ≥ 100 mg/dL, wait 1 hour, then restart insulin infusion at 50% of original rate.")
    
    elif 50 <= curr_bg <= 74:
        st.error("**CRITICAL: D/C INSULIN INFUSION**\n\nIf symptomatic: give 1 amp (25 g) D50 IV. \n\nIf asymptomatic: give 1/2 Amp (12.5 g) D50 IV or 8 ounces juice. \n\nRecheck BG q 15-30 minutes. When BG ≥ 100 mg/dL, wait 1 hour, then restart infusion at 75% of original rate.")

    # Main Protocol Logic Grid (>= 75 mg/dL)
    else:
        action_text = ""
        new_rate = curr_rate

        # Column 4: BG >= 200
        if curr_bg >= 200:
            if bg_change > 0:
                action_text = f"↑ INFUSION by 2Δ (+{two_delta} U/hr)"
                new_rate = curr_rate + two_delta
            elif -25 <= bg_change <= 0:
                action_text = f"↑ INFUSION by Δ (+{delta} U/hr)"
                new_rate = curr_rate + delta
            elif -75 <= bg_change <= -26:
                action_text = "NO INFUSION CHANGE"
            elif -100 <= bg_change <= -76:
                action_text = f"↓ INFUSION by Δ (-{delta} U/hr)"
                new_rate = max(0, curr_rate - delta)
            else: # BG dropping by > 100
                action_text = f"HOLD x 30 min, then ↓ INFUSION by 2Δ (-{two_delta} U/hr)"
                new_rate = max(0, curr_rate - two_delta)

        # Column 3: BG 140-199
        elif 140 <= curr_bg <= 199:
            if bg_change > 50:
                action_text = f"↑ INFUSION by 2Δ (+{two_delta} U/hr)"
                new_rate = curr_rate + two_delta
            elif 0 <= bg_change <= 50:
                action_text = f"↑ INFUSION by Δ (+{delta} U/hr)"
                new_rate = curr_rate + delta
            elif -50 <= bg_change <= -1:
                action_text = "NO INFUSION CHANGE"
            elif -75 <= bg_change <= -51:
                action_text = f"↓ INFUSION by Δ (-{delta} U/hr)"
                new_rate = max(0, curr_rate - delta)
            else: # BG dropping by > 75
                action_text = f"HOLD x 30 min, then ↓ INFUSION by 2Δ (-{two_delta} U/hr)"
                new_rate = max(0, curr_rate - two_delta)

        # Column 2: BG 100-139
        elif 100 <= curr_bg <= 139:
            if bg_change > 25:
                action_text = f"↑ INFUSION by Δ (+{delta} U/hr)"
                new_rate = curr_rate + delta
            elif -25 <= bg_change <= 25:
                action_text = "NO INFUSION CHANGE"
            elif -50 <= bg_change <= -26:
                action_text = f"↓ INFUSION by Δ (-{delta} U/hr)"
                new_rate = max(0, curr_rate - delta)
            else: # BG dropping by > 50
                action_text = f"HOLD x 30 min, then ↓ INFUSION by 2Δ (-{two_delta} U/hr)"
                new_rate = max(0, curr_rate - two_delta)

        # Column 1: BG 75-99
        elif 75 <= curr_bg <= 99:
            if bg_change > 0:
                action_text = "NO INFUSION CHANGE"
            elif -25 <= bg_change <= 0:
                action_text = f"↓ INFUSION by Δ (-{delta} U/hr)"
                new_rate = max(0, curr_rate - delta)
            else: # BG dropping by > 25 (Special Dagger Note)
                action_text = "D/C INSULIN INFUSION. √BG q 30 min; when BG ≥ 100 mg/dL, restart infusion @ 75% of most recent rate."
                new_rate = curr_rate * 0.75

        # Display Results
        if "D/C" in action_text or "HOLD" in action_text:
            st.warning(f"**Action:** {action_text}")
            if "restart" in action_text or "then ↓" in action_text:
                 st.info(f"**Future Target Rate:** {new_rate:.1f} U/hr")
        elif "NO INFUSION CHANGE" in action_text:
            st.info(f"**Action:** {action_text}")
            st.success(f"**Continue Current Rate:** {curr_rate:.1f} U/hr")
        else:
            st.info(f"**Action:** {action_text}")
            st.success(f"**Recommended New Rate:** {new_rate:.1f} U/hr")

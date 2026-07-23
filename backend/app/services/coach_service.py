"""
services/coach_service.py
─────────────────────────
Provides financial advice and chatbot replies in English, Hindi, and Gujarati.
Calls Claude (via Anthropic) if ANTHROPIC_API_KEY is configured; otherwise,
falls back to a localized deterministic expert recommendation engine.
"""
import os
import json
import logging
import httpx

logger = logging.getLogger(__name__)

# ── Localized Fallback Recommendation Strategies ──────────────────────────────
COACH_STRATEGIES_EN = {
    "bill_payment_regularity": {
        "title": "Automate Bill Payments",
        "detail": "Set up auto-debit on your primary account for utility, internet, and phone bills. This ensures you never miss a payment deadline.",
        "impact_estimate": "+35 to +50 points"
    },
    "monthly_savings_pct": {
        "title": "Micro-Savings Target",
        "detail": "Automate a weekly transfer of 10% of your income into a recurring deposit. Consistent deposits prove liquidity to credit engines.",
        "impact_estimate": "+20 to +35 points"
    },
    "bank_balance_stability": {
        "title": "Maintain Buffer Balance",
        "detail": "Ensure your savings account balance remains above 1 month of average expenses. An active buffer lowers the risk flags.",
        "impact_estimate": "+15 to +25 points"
    },
    "recharge_frequency": {
        "title": "Establish Top-up Pattern",
        "detail": "Instead of single large recharges, distribute them into consistent smaller top-ups. More frequent recharges count as digital transactions.",
        "impact_estimate": "+15 to +20 points"
    },
    "wallet_usage_score": {
        "title": "Consolidate Wallet Spend",
        "detail": "Channel small daily transactions (groceries, transport) through your digital wallet. Active wallets signal credit engagement.",
        "impact_estimate": "+10 to +15 points"
    },
    "upi_transaction_count": {
        "title": "Diversify UPI Transactions",
        "detail": "Initiate at least 15 small transactions per month. Regular UPI history demonstrates consistent digital cash flow.",
        "impact_estimate": "+15 to +25 points"
    },
    "ecommerce_frequency": {
        "title": "Build Purchase History",
        "detail": "Moderate shopping activity on e-commerce platforms using digital payment options builds active history signals.",
        "impact_estimate": "+10 points"
    }
}

COACH_STRATEGIES_HI = {
    "bill_payment_regularity": {
        "title": "बिल भुगतान स्वचालित करें",
        "detail": "उपयोगिता, इंटरनेट और फोन बिलों के लिए अपने मुख्य खाते पर ऑटो-डेबिट सेट करें। इससे भुगतान की समय-सीमा कभी नहीं छूटेगी।",
        "impact_estimate": "+35 से +50 अंक"
    },
    "monthly_savings_pct": {
        "title": "माइक्रो-बचत लक्ष्य",
        "detail": "अपनी आय का 10% आवर्ती जमा (RD) में साप्ताहिक रूप से ऑटो-ट्रांसफर करें। नियमित जमा से क्रेडिट स्कोर बढ़ता है।",
        "impact_estimate": "+20 से +35 अंक"
    },
    "bank_balance_stability": {
        "title": "बफर बैलेंस बनाए रखें",
        "detail": "सुनिश्चित करें कि आपका बचत खाता शेष कम से कम 1 महीने के औसत खर्च से अधिक रहे।",
        "impact_estimate": "+15 से +25 अंक"
    },
    "recharge_frequency": {
        "title": "नियमित टॉप-अप पैटर्न",
        "detail": "एक बड़े रिचार्ज के बजाय, समय-समय पर छोटे और नियमित रिचार्ज करें।",
        "impact_estimate": "+15 से +20 अंक"
    },
    "wallet_usage_score": {
        "title": "डिजिटल वॉलेट उपयोग करें",
        "detail": "दैनिक छोटे-मोटे खर्चों के लिए डिजिटल वॉलेट का प्रयोग करें।",
        "impact_estimate": "+10 से +15 अंक"
    },
    "upi_transaction_count": {
        "title": "UPI लेन-देन बढ़ाएं",
        "detail": "प्रति माह कम से कम 15 छोटे डिजिटल लेन-देन करें। नियमित डिजिटल कैश फ्लो क्रेडिट प्रोफाइल को मजबूत करता है।",
        "impact_estimate": "+15 से +25 अंक"
    },
    "ecommerce_frequency": {
        "title": "डिजिटल खरीद इतिहास बनाएं",
        "detail": "ऑनलाइन खरीदारी में डिजिटल भुगतान का नियमित उपयोग करें।",
        "impact_estimate": "+10 अंक"
    }
}

COACH_STRATEGIES_GU = {
    "bill_payment_regularity": {
        "title": "બિલ ચુકવણી ઓટોમેટ કરો",
        "detail": "યુટિલિટી, ઇન્ટરનેટ અને ફોન બિલ માટે તમારા પ્રાથમિક ખાતા પર ઓટો-ડેબિટ સેટ કરો. આનાથી ચૂકવણી ચૂકશે નહીં.",
        "impact_estimate": "+35 થી +50 પોઇન્ટ"
    },
    "monthly_savings_pct": {
        "title": "માઇક્રો-બચત લક્ષ્ય",
        "detail": "તમારી આવકના 10% રિકરિંગ ડિપોઝિટમાં દર અઠવાડિયે ઓટો-ટ્રાન્સફર કરો. નિયમિત બચત ક્રેડિટ સ્કોર સુધારે છે.",
        "impact_estimate": "+20 થી +35 પોઇન્ટ"
    },
    "bank_balance_stability": {
        "title": "બફર બેલેન્સ જાળવો",
        "detail": "ખાતરી કરો કે તમારું બેંક બેલેન્સ ઓછામાં ઓછું 1 મહિનાના સરેરાશ ખર્ચથી ઉપર રહે.",
        "impact_estimate": "+15 થી +25 પોઇન્ટ"
    },
    "recharge_frequency": {
        "title": "ટોપ-અપ પેટર્ન બનાવો",
        "detail": "એક મોટો રિચાર્જ કરવાને બદલે સમયાંતરે નાના અને નિયમિત રિચાર્જ કરો.",
        "impact_estimate": "+15 થી +20 પોઇન્ટ"
    },
    "wallet_usage_score": {
        "title": "ડિજિટલ વોલેટનો ઉપયોગ",
        "detail": "રોજિંદા નાના વ્યવહારો ડિજિટલ વોલેટ દ્વારા કરો.",
        "impact_estimate": "+10 થી +15 પોઇન્ટ"
    },
    "upi_transaction_count": {
        "title": "UPI વ્યવહારો વધારો",
        "detail": "દર મહિને ઓછામાં ઓછા 15 નાના ડિજિટલ વ્યવહારો કરો.",
        "impact_estimate": "+15 થી +25 પોઇન્ટ"
    },
    "ecommerce_frequency": {
        "title": "ડિજિટલ ખરીદી ઇતિહાસ",
        "detail": "ઈ-કોમર્સ પ્લેટફોર્મ પર ડિજિટલ પેમેન્ટથી ખરીદી કરો.",
        "impact_estimate": "+10 પોઇન્ટ"
    }
}


def get_coach_advice(
    credit_score: int,
    shap_factors: list[dict],
    monthly_savings_pct: float,
    monthly_income: float,
    risk_level: str | None = None,
    language: str = "en",
    messages: list[dict] | None = None
) -> dict:
    """
    Returns localized advice dict with summary, recommendations, and conversational reply.
    Supports language = 'en', 'hi', or 'gu'.
    """
    lang = language.lower() if language else "en"
    if lang not in {"en", "hi", "gu"}:
        lang = "en"

    # Select strategy dictionary
    if lang == "hi":
        strategies = COACH_STRATEGIES_HI
    elif lang == "gu":
        strategies = COACH_STRATEGIES_GU
    else:
        strategies = COACH_STRATEGIES_EN

    # ── Check for Anthropic API Key for Live LLM ──────────────────────────────
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        try:
            lang_instruction = "Respond entirely in English."
            if lang == "hi":
                lang_instruction = "CRITICAL: You MUST write ALL summary, titles, details, and reply text ENTIRELY in Hindi (हिंदी). All content must be natural, clear Devanagari script."
            elif lang == "gu":
                lang_instruction = "CRITICAL: You MUST write ALL summary, titles, details, and reply text ENTIRELY in Gujarati (ગુજરાતી). All content must be natural, clear Gujarati script."

            system_prompt = (
                f"You are an encouraging, expert AI Financial Coach. {lang_instruction} "
                "Analyze the user's financial details and return a response in strictly valid JSON format. "
                "Do not return any Markdown wrapper or conversational prefix outside the JSON. Return exactly: \n"
                "{\n"
                '  "summary": "2-3 encouraging sentences summarizing their financial situation",\n'
                '  "recommendations": [\n'
                '     {"title": "Action title", "detail": "encouraging description (max 2 sentences)", "impact_estimate": "+X points"}\n'
                "  ],\n"
                '  "reply": "Contextual friendly answer if the user asked a follow-up question; otherwise null"\n'
                "}"
            )

            user_query = ""
            if messages and len(messages) > 0:
                user_query = f"\nUser follow-up question: {messages[-1].get('content', '')}"

            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1000,
                "system": system_prompt,
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"Credit Score: {credit_score}\n"
                            f"SHAP Factors: {json.dumps(shap_factors)}\n"
                            f"Savings Rate: {monthly_savings_pct}%\n"
                            f"Income: ₹{monthly_income}/mo\n"
                            f"Risk Level: {risk_level or 'Medium'}\n"
                            f"Target Language: {lang}\n"
                            f"{user_query}"
                        )
                    }
                ]
            }

            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }

            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
                if res.status_code == 200:
                    content_text = res.json()["content"][0]["text"]
                    data = json.loads(content_text)
                    return data
        except Exception as e:
            logger.warning(f"Claude API failed: {e}. Falling back to localized rule-based engine.")

    # ── Localized Deterministic Rule-Based Fallback (Offline-Ready) ───────────
    negative_drivers = []
    for factor in shap_factors:
        direction = factor.get("direction", "")
        feat_name = factor.get("feature", "")
        if direction in ("negative", "hurts") or factor.get("contribution", 0) < 0:
            negative_drivers.append(feat_name)

    if not negative_drivers:
        negative_drivers = ["bill_payment_regularity", "monthly_savings_pct", "bank_balance_stability"]

    recs = []
    seen = set()
    for feat in negative_drivers:
        if feat in strategies and feat not in seen:
            recs.append(strategies[feat])
            seen.add(feat)
            if len(recs) == 3:
                break

    for feat, strategy in strategies.items():
        if len(recs) >= 3:
            break
        if feat not in seen:
            recs.append(strategy)
            seen.add(feat)

    # Localized Summary & Reply logic
    if lang == "hi":
        if credit_score >= 700:
            summary = f"शानदार वित्तीय स्वास्थ्य! {credit_score} के क्रेडिट स्कोर के साथ आप उत्कृष्ट स्थिति में हैं। बचत और स्थिर लेन-देन बनाए रखें।"
        elif credit_score >= 550:
            summary = f"आपने {credit_score} क्रेडिट स्कोर के साथ एक मजबूत आधार बनाया है। नियमित बिल भुगतान और बफर बैलेंस इसे और बेहतर बना सकते हैं।"
        else:
            summary = f"आपका वर्तमान स्कोर {credit_score} है। बिल भुगतान पर ध्यान केंद्रित करके और मासिक बचत बनाए रखकर हम इसे धीरे-धीरे बढ़ा सकते हैं।"

        reply = None
        if messages and len(messages) > 0:
            user_query = messages[-1].get("content", "").lower()
            if "faster" in user_query or "improve" in user_query or "तेजी" in user_query or "सुधार" in user_query:
                reply = "क्रेडिट स्कोर तेजी से बढ़ाने के लिए उपयोगिता बिलों को ऑटो-डेबिट पर रखें और हर महीने बचत दर स्थिर बनाए रखें।"
            elif "invest" in user_query or "निवेश" in user_query:
                reply = "अपनी बचत दर के अनुसार ₹500 - ₹2,000 की मासिक SIP सूचकांक फंड से शुरुआत करें।"
            else:
                reply = f"आपका क्रेडिट स्कोर {credit_score} है। अपने सभी फोन और बिजली बिलों को एक ही खाते से ऑटो-डेबिट पर सेट करें।"

    elif lang == "gu":
        if credit_score >= 700:
            summary = f"ઉત્કૃષ્ટ નાણાકીય સ્થિતિ! {credit_score} ના ક્રેડિટ સ્કોર સાથે તમે ઉત્તમ ટ્રેક પર છો. તમારી બચત દર જાળવી રાખો."
        elif credit_score >= 550:
            summary = f"તમે {credit_score} ક્રેડિટ સ્કોર સાથે મજબૂત પાયો બનાવ્યો છે. નિયમિત બિલ ચુકવણીથી તમારો સ્કોર વધુ સુધરશે."
        else:
            summary = f"તમારો હાલનો સ્કોર {credit_score} છે. યુટિલિટી બિલો અને માઇક્રો-બચત પર ધ્યાન આપીને આપણે સ્કોર વધારી શકીએ છીએ."

        reply = None
        if messages and len(messages) > 0:
            user_query = messages[-1].get("content", "").lower()
            if "faster" in user_query or "improve" in user_query or "ઝડપી" in user_query or "સુધારો" in user_query:
                reply = "સ્કોર ઝડપથી સુધારવા માટે યુટિલિટી બિલો ઓટો-ડેબિટ પર રાખો અને માસિક બચત દર જાળવો."
            elif "invest" in user_query or "રોકાણ" in user_query:
                reply = "તમારી બચત મુજબ ₹500 - ₹2,000 ની માસિક SIP ઇન્ડેક્સ ફંડથી શરૂઆત કરો."
            else:
                reply = f"તમારો હાલનો સ્કોર {credit_score} છે. તમારા બધા બિલોને ઓટો-ડેબિટ પર સેટ કરવાની સલાહ આપવામાં આવે છે."

    else:  # English default
        if credit_score >= 700:
            summary = (
                f"Superb financial health! With a credit score of {credit_score}, you are on the fast track "
                "to credit eligibility. Maintaining your savings rate and transaction stability will secure premium rates."
            )
        elif credit_score >= 550:
            summary = (
                f"You have built a solid foundation with a {credit_score} credit score. Adjusting a few key behaviors like "
                "bill regularity and balance buffer can elevate you to the high-tier credit category soon."
            )
        else:
            summary = (
                f"Your current score is {credit_score}. Don't worry — by focusing on Utility Bills and maintaining regular "
                "monthly micro-savings, we can steadily build your credit history step-by-step."
            )

        reply = None
        if messages and len(messages) > 0:
            user_query = messages[-1].get("content", "").lower()
            if "faster" in user_query or "improve" in user_query:
                reply = (
                    "To improve your score faster, focus on Utility Bill Payments and Savings Rate. "
                    "Automating your bills removes payment variance instantly, adding positive credit signal points."
                )
            elif "invest" in user_query or "advisor" in user_query:
                reply = (
                    "Based on your savings rate, start with a simple ₹500 - ₹2,000 monthly SIP index fund. "
                    "It builds capital while remaining accessible for emergency cushions."
                )
            else:
                reply = (
                    f"That's a great question. Given your current score of {credit_score}, my top recommendation is to "
                    "ensure all phone and utility bills are paid through a single account on auto-debit."
                )

    return {
        "summary": summary,
        "recommendations": recs,
        "reply": reply
    }

import requests
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


def get_product(barcode):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    response = requests.get(url)
    data = response.json()
    if data.get("status") != 1:
        raise HTTPException(f"Product not found")
    product = data["product"]
    return product

def get_score(product: Dict[str, Any]) -> Dict[str, Any]:

    score = 50
    factors = []

    # categories
    categories_tags = product.get("categories_tags", [])
    categories_str = ' '.join (categories_tags).lower()

    if any(word in categories_str for word in ["beef", "veal", "lamb", "red-meat"]):
        score += 30
        factors.append({"factor": "Red Meat", "impact": "+30"})
    elif any(word in categories_str for word in ["poultry", "chicken", "turkey", "pork"]):
        score += 20
        factors.append({"factor": "Meat", "impact": "+20"})
    elif any(word in categories_str for word in ["fish", "seafood"]):
        score += 12
        factors.append({"factor": "Fish", "impact": "+12"})
    elif any(word in categories_str for word in ["dairy", "cheese", "milk"]):
        score += 10
        factors.append({"factor": "Dairy", "impact": "+10"})

    # ingredients (vegan/vegetarian)
    ingredients_analysis_tags = product.get("ingredients_analysis_tags", [])
    ingredients_str = ' '.join (ingredients_analysis_tags).lower()

    if "en:vegan" in ingredients_str:
        score -= 20
        factors.append({"factor": "Vegan", "impact": "-20"})
    elif "en:vegetarian" in ingredients_str:
        score -= 10
        factors.append({"factor": "Vegetarian", "impact": "-10"})

    # processing level (nova grade)
    nova_group = product.get("nova_group")
    if nova_group == 4:
        score += 15
        factors.append({"factor": "Ultra-processed", "impact": "+15"})
    elif nova_group == 3:
        score += 8
        factors.append({"factor": "Processed", "impact": "+8"})
    elif nova_group == 2:
        score += 0
        factors.append({"factor": "Slightly Processed", "impact": "+0"})
    elif nova_group == 1:
        score -= 8
        factors.append({"factor": "Unprocessed", "impact": "-8"})

    # packaging
    packaging_materials = product.get("packaging_materials_tags", [])
    packaging_str = ' '.join (packaging_materials).lower()

    if any(word in packaging_str for word in ["plastic", "en:plastic"]):
        score += 10
        factors.append({"factor": "Plastic Packaging", "impact": "+10"})

    # labels
    labels_tags = product.get("labels_tags", [])
    labels_str = ' '.join (labels_tags).lower()

    if any(word in labels_str for word in ["organic", "en:organic"]):
        score -= 10
        factors.append({"factor": "Organic", "impact": "-10"})
    if any(word in labels_str for word in ["fair-trade", "en:fair-trade"]):
        score -= 5
        factors.append({"factor": "Fair Trade", "impact": "-5"})
    if any(word in labels_str for word in ["palm-oil-free", "en:palm-oil-free"]):
        score -= 3
        factors.append({"factor": "Palm Oil Free", "impact": "-3"})

    factors = sorted(factors, key=lambda x: abs(int(x["impact"])), reverse=True)
    top_3_factors = factors[:3]

    score = max(0, min(100, score))

    if score <= 20:
        grade, description = "A", "Very Environmentally Friendly"
    elif score <= 40:
        grade, description = "B", "Environmentally Friendly"
    elif score <= 60:
        grade, description = "C", "Moderately Environmentally Friendly"
    elif score <= 80:
        grade, description = "D", "Not Environmentally Friendly"
    else:
        grade, description = "E", "Very Unfriendly"

    response = {
        "name": product.get("product_name", "Unknown Product"),
        "score": score,
        "grade": grade,
        "description": description,
        "top_factors": top_3_factors
    }

    # check for ecoscore data

    ecoscore_data = product.get("ecoscore_data", {})
    previous_data = ecoscore_data.get("previous_data", {})
    agribalyse = previous_data.get("agribalyse", {})
    
    if agribalyse:
        co2_total = agribalyse.get("co2_total")
        co2_agriculture = agribalyse.get("co2_agriculture")
        co2_packaging = agribalyse.get("co2_packaging")
        co2_transportation = agribalyse.get("co2_transportation")
        
        response["advanced_data_available"] = True
        response["carbon_footprint"] = {
            "total_kg_per_kg": co2_total,
            "agriculture_kg": co2_agriculture,
            "packaging_kg": co2_packaging,
            "transportation_kg": co2_transportation
        }
        
    else:
        response["advanced_data_available"] = False
        response["message"] = "Advanced information is not available for this product"
    
    return response
    pass

@app.get("/api/product/{barcode}")
async def get_product_endpoint(barcode: str):
    try:
        product = get_product(barcode)
        score_data = get_score(product)
        
        return score_data
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
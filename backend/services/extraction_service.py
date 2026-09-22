import re
from typing import Dict, Any, List, Optional, Tuple

class ExtractionService:
    def __init__(self):
        # Legal Metrology Standard Metric Units (Schedule II)
        self.valid_metric_units = [
            'g', 'kg', 'mg', 
            'ml', 'l', 'kl', 
            'm', 'cm', 'mm', 
            'sq m', 'sq cm', 
            'n', 'u', 'count'
        ]
        
        # Non-standard illegal units flagged by Legal Metrology
        self.non_standard_units = ['gms', 'gm', 'kgs', 'kgm', 'ltrs', 'ltr', 'ml.', 'nos', 'fl oz', 'oz']

    def extract_fields(self, ocr_data: Dict[str, Any], raw_text_override: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Parses OCR raw text and bounding boxes into structured Legal Metrology fields:
        - manufacturer_packer
        - commodity_name
        - net_quantity
        - mfg_date
        - mrp
        - consumer_care
        - country_of_origin
        """
        full_text = raw_text_override if raw_text_override is not None else ocr_data.get("full_text", "")
        lines = ocr_data.get("lines", [])
        
        extracted = {}

        # 1. Maximum Retail Price (MRP)
        mrp_data = self._extract_mrp(full_text, lines)
        extracted["mrp"] = mrp_data

        # 2. Net Quantity
        net_qty_data = self._extract_net_quantity(full_text, lines)
        extracted["net_quantity"] = net_qty_data

        # 3. Manufacturing / Packing Date
        mfg_date_data = self._extract_mfg_date(full_text, lines)
        extracted["mfg_date"] = mfg_date_data

        # 4. Manufacturer / Packer / Importer
        mfg_data = self._extract_manufacturer(full_text, lines)
        extracted["manufacturer_packer"] = mfg_data

        # 5. Consumer Care Redressal
        care_data = self._extract_consumer_care(full_text, lines)
        extracted["consumer_care"] = care_data

        # 6. Commodity Name
        name_data = self._extract_commodity_name(full_text, lines)
        extracted["commodity_name"] = name_data

        # 7. Country of Origin
        origin_data = self._extract_country_of_origin(full_text, lines)
        extracted["country_of_origin"] = origin_data

        return extracted

    def _extract_mrp(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        patterns = [
            r'(?:MRP|M\.R\.P\.|Max\.?\s*Retail\s*Price)\s*(?:[:\.\-]|is)?\s*(?:₹|Rs\.?|INR)?\s*([0-9]+(?:[\.,][0-9]{2})?(?:\s*\(?incl\.?\s*of\s*all\s*taxes\)?)?)',
            r'(?:₹|Rs\.?|INR)\s*([0-9]+(?:[\.,][0-9]{2})?)\s*(?:incl\.?\s*of\s*all\s*taxes)?',
            r'MRP\s*[:=]?\s*([0-9]+(?:[\.,][0-9]{2})?)'
        ]
        
        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                val = match.group(0).strip()
                bbox = self._find_matching_bbox(match.group(0), lines, default_idx=3)
                return {
                    "field_key": "mrp",
                    "field_label": "Maximum Retail Price (MRP)",
                    "detected_value": val,
                    "is_detected": True,
                    "confidence": 0.96,
                    "bounding_box": bbox,
                    "status": "DETECTED"
                }

        for line in lines:
            lt = line.get("text", "")
            if re.search(r'(?:mrp|rs\.?|₹|inr)', lt, re.IGNORECASE):
                return {
                    "field_key": "mrp",
                    "field_label": "Maximum Retail Price (MRP)",
                    "detected_value": lt,
                    "is_detected": True,
                    "confidence": line.get("confidence", 0.90),
                    "bounding_box": line.get("bbox"),
                    "status": "DETECTED"
                }

        return {
            "field_key": "mrp",
            "field_label": "Maximum Retail Price (MRP)",
            "detected_value": None,
            "is_detected": False,
            "confidence": 0.0,
            "bounding_box": None,
            "status": "NOT_DETECTED"
        }

    def _extract_net_quantity(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        patterns = [
            r'(?:Net\s*(?:Qty|Quantity|Weight|Wt|Content|Vol|Volume)\.?\s*[:\.\-]?\s*)?([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|gm|gms|ml|l|ltr|ltrs|kl|mg|m|cm|n|u|units?|fl oz|oz))\b',
            r'\b([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|ml|l|mg|n))\b'
        ]

        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                val = match.group(0).strip()
                bbox = self._find_matching_bbox(val, lines, default_idx=2)
                
                is_standard = True
                for ns in self.non_standard_units:
                    if ns in val.lower():
                        is_standard = False
                        break

                conf = 0.96 if is_standard else 0.65
                return {
                    "field_key": "net_quantity",
                    "field_label": "Net Quantity",
                    "detected_value": val,
                    "is_detected": True,
                    "confidence": conf,
                    "bounding_box": bbox,
                    "status": "DETECTED" if is_standard else "REVIEW",
                    "is_standard_unit": is_standard
                }

        for line in lines:
            lt = line.get("text", "")
            if re.search(r'\b\d+\s*(?:g|kg|ml|l|mg|n)\b', lt, re.IGNORECASE):
                return {
                    "field_key": "net_quantity",
                    "field_label": "Net Quantity",
                    "detected_value": lt,
                    "is_detected": True,
                    "confidence": line.get("confidence", 0.90),
                    "bounding_box": line.get("bbox"),
                    "status": "DETECTED"
                }

        return {
            "field_key": "net_quantity",
            "field_label": "Net Quantity",
            "detected_value": None,
            "is_detected": False,
            "confidence": 0.0,
            "bounding_box": None,
            "status": "NOT_DETECTED"
        }

    def _extract_mfg_date(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        patterns = [
            r'(?:MFD|PKD|MFG|PACKED|MANUFACTURED|DATE OF PKG)\.?\s*[:\.\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{2,4}|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-z]*[\s\.\-\/]*20[0-9]{2})',
            r'\b(0[1-9]|1[0-2])[\/\-](20[2-3][0-9]|[2-3][0-9])\b'
        ]

        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                val = match.group(0).strip()
                bbox = self._find_matching_bbox(val, lines, default_idx=4)
                return {
                    "field_key": "mfg_date",
                    "field_label": "Month & Year of Manufacture/Packing",
                    "detected_value": val,
                    "is_detected": True,
                    "confidence": 0.95,
                    "bounding_box": bbox,
                    "status": "DETECTED"
                }

        for line in lines:
            lt = line.get("text", "")
            if re.search(r'(?:mfd|pkd|mfg|packed|date)', lt, re.IGNORECASE):
                return {
                    "field_key": "mfg_date",
                    "field_label": "Month & Year of Manufacture/Packing",
                    "detected_value": lt,
                    "is_detected": True,
                    "confidence": line.get("confidence", 0.90),
                    "bounding_box": line.get("bbox"),
                    "status": "DETECTED"
                }

        return {
            "field_key": "mfg_date",
            "field_label": "Month & Year of Manufacture/Packing",
            "detected_value": None,
            "is_detected": False,
            "confidence": 0.0,
            "bounding_box": None,
            "status": "NOT_DETECTED"
        }

    def _extract_manufacturer(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        patterns = [
            r'(?:Mfd\.?\s*by|Manufactured\s*by|Packed\s*by|Pkd\.?\s*by|Marketed\s*by|Imported\s*by|Mfg\s*by)\s*[:\.\-]?\s*([^\n\r]{8,150})',
            r'(?:Manufactured|Packed|Imported)\s*by\s*[:\.\-]?\s*([^\n\r]+)'
        ]

        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                val = match.group(0).strip()
                if not any(stop in val.lower() for stop in ['[not', '[missing', 'visit:']):
                    bbox = self._find_matching_bbox(val, lines, default_idx=5)
                    return {
                        "field_key": "manufacturer_packer",
                        "field_label": "Manufacturer / Packer / Importer",
                        "detected_value": val[:120],
                        "is_detected": True,
                        "confidence": 0.94,
                        "bounding_box": bbox,
                        "status": "DETECTED"
                    }

        for line in lines:
            lt = line.get("text", "")
            if re.search(r'(?:mfd|manufactured|packed|marketed|ltd|pvt|corp|industries|foods)', lt, re.IGNORECASE):
                if not any(stop in lt.lower() for stop in ['[not', '[missing', 'visit:']):
                    return {
                        "field_key": "manufacturer_packer",
                        "field_label": "Manufacturer / Packer / Importer",
                        "detected_value": lt,
                        "is_detected": True,
                        "confidence": line.get("confidence", 0.88),
                        "bounding_box": line.get("bbox"),
                        "status": "DETECTED"
                    }

        return {
            "field_key": "manufacturer_packer",
            "field_label": "Manufacturer / Packer / Importer",
            "detected_value": None,
            "is_detected": False,
            "confidence": 0.0,
            "bounding_box": None,
            "status": "NOT_DETECTED"
        }

    def _extract_consumer_care(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'(?:1800[-\s]?[0-9]{3,4}[-\s]?[0-9]{3,4}|(?:\+91|0)?[6-9][0-9]{9}|[0-9]{3,4}[-\s]?[0-9]{6,8})'
        care_label_pattern = r'(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll\s*Free|Feedback|Queries|Contact\s*Us)\s*[:\.\-]?\s*([^\n\r]+)'

        found_items = []
        emails = re.findall(email_pattern, text)
        phones = re.findall(phone_pattern, text)
        care_match = re.search(care_label_pattern, text, re.IGNORECASE)

        if emails:
            found_items.append(f"Email: {emails[0]}")
        if phones:
            found_items.append(f"Helpline: {phones[0]}")
        if care_match and not (emails or phones):
            txt = care_match.group(0).strip()
            if not any(stop in txt.lower() for stop in ['[not', 'missing', 'none']):
                found_items.append(txt[:100])

        if found_items:
            combined = " | ".join(found_items)
            bbox = self._find_matching_bbox(emails[0] if emails else (phones[0] if phones else found_items[0]), lines, default_idx=6)
            return {
                "field_key": "consumer_care",
                "field_label": "Consumer Care Information",
                "detected_value": combined,
                "is_detected": True,
                "confidence": 0.93,
                "bounding_box": bbox,
                "status": "DETECTED"
            }

        for line in lines:
            lt = line.get("text", "")
            if re.search(r'(?:care|toll\s*free|helpline|1800|@|feedback)', lt, re.IGNORECASE):
                if not any(stop in lt.lower() for stop in ['[not', 'missing', 'none']):
                    return {
                        "field_key": "consumer_care",
                        "field_label": "Consumer Care Information",
                        "detected_value": lt,
                        "is_detected": True,
                        "confidence": line.get("confidence", 0.80),
                        "bounding_box": line.get("bbox"),
                        "status": "REVIEW"
                    }

        return {
            "field_key": "consumer_care",
            "field_label": "Consumer Care Information",
            "detected_value": None,
            "is_detected": False,
            "confidence": 0.0,
            "bounding_box": None,
            "status": "NOT_DETECTED"
        }

    def _extract_commodity_name(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        match = re.search(r'(?:Generic\s*Name|Commodity|Product)\s*[:\.\-]?\s*([^\n\r]+)', text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            bbox = self._find_matching_bbox(val, lines, default_idx=1)
            return {
                "field_key": "commodity_name",
                "field_label": "Generic Commodity Name",
                "detected_value": val,
                "is_detected": True,
                "confidence": 0.96,
                "bounding_box": bbox,
                "status": "DETECTED"
            }

        if lines:
            first_line = lines[0]
            val = first_line.get("text", "Packaged Product")
            return {
                "field_key": "commodity_name",
                "field_label": "Generic Commodity Name",
                "detected_value": val if val else "Packaged Commodity",
                "is_detected": True,
                "confidence": first_line.get("confidence", 0.92),
                "bounding_box": first_line.get("bbox"),
                "status": "DETECTED"
            }
        return {
            "field_key": "commodity_name",
            "field_label": "Generic Commodity Name",
            "detected_value": "Packaged Product",
            "is_detected": True,
            "confidence": 0.85,
            "bounding_box": None,
            "status": "DETECTED"
        }

    def _extract_country_of_origin(self, text: str, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        patterns = [
            r'(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\.\-]?\s*([A-Za-z\s]+)',
            r'\b(?:Made\s*in\s*India|Product\s*of\s*India)\b'
        ]

        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                val = match.group(0).strip()
                bbox = self._find_matching_bbox(val, lines, default_idx=7)
                return {
                    "field_key": "country_of_origin",
                    "field_label": "Country of Origin",
                    "detected_value": val,
                    "is_detected": True,
                    "confidence": 0.95,
                    "bounding_box": bbox,
                    "status": "DETECTED"
                }

        return {
            "field_key": "country_of_origin",
            "field_label": "Country of Origin",
            "detected_value": None,
            "is_detected": False,
            "confidence": 0.0,
            "bounding_box": None,
            "status": "NOT_DETECTED"
        }

    def _find_matching_bbox(self, snippet: str, lines: List[Dict[str, Any]], default_idx: int = 0) -> Optional[Dict[str, Any]]:
        for line in lines:
            text = line.get("text", "")
            if snippet.lower() in text.lower() or text.lower() in snippet.lower():
                return line.get("bbox")
        
        if lines and default_idx < len(lines):
            return lines[default_idx].get("bbox")
        elif lines:
            return lines[0].get("bbox")
        return None

extraction_service_instance = ExtractionService()

